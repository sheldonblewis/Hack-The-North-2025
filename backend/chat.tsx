import { type Message } from "@/types/chat";
import { Bot, User, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Layout } from "@/components/layout/Layout";
import { formatTime } from "@/utils/formatTime";
import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { env } from "@/env";

// Update types to include flags
type FlagType = "contradiction" | "uncertain";

type Flag = {
  type: "flag";
  flag_type: FlagType;
  summary: string;
  amendment: string;
  situations: string[];
  suggestion: string;
  message_id: number;
};

// Update Message type to include messageId and flag
type ChatMessage = {
  role: "simulation_bot" | "user_bot";
  text: string;
  messageId: number;
  timestamp: string;
  flag?: Flag;
};

// Hardcoded messages for UI development
const mockMessages: Message[] = [
  {
    type: "user_response",
    input: "Hello, how can I help you today?",
    id: "1",
  },
  {
    type: "evaluator_response",
    input: "I need help understanding quantum computing concepts. Can you explain superposition?",
    id: "2",
  },
  {
    type: "user_response",
    input: "Superposition is a fundamental principle of quantum mechanics where quantum systems can exist in multiple states simultaneously. Imagine a coin spinning - while it's spinning, it's in a combination of both heads and tails until observed.",
    id: "3",
  },
  {
    type: "evaluator_response",
    input: "That's interesting! Can you give me a more practical example of how this is used in quantum computing?",
    id: "4",
  }
];

// Add this type
type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
};

const SimpleDialog = ({ isOpen, onClose, title, children, className }: DialogProps) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 ${className || ''}`}>
      <div className="bg-white rounded-lg w-full max-w-[800px] max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// Add type for flag details popup
type FlagDetailsProps = {
  flag: Flag;
  onClose: () => void;
};

// Add the FlagDetails component
const FlagDetails = ({ flag, onClose }: FlagDetailsProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-[600px] shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 space-y-6">
          {/* Icon and Type */}
          <div className="flex flex-col items-center text-center">
            <div className={`rounded-full p-3 mb-4 ${
              flag.flag_type === "contradiction" 
                ? "bg-red-100 text-red-600" 
                : "bg-yellow-100 text-yellow-600"
            }`}>
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Issue: {flag.flag_type === "contradiction" ? "Contradiction" : "Uncertainty"}
            </h2>
            <p className="text-gray-600 text-sm">
              {flag.flag_type === "contradiction"
                ? "Your AI directly went against its configuration"
                : "Your AI said something that was not accounted for in its configuration"}
            </p>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-800">{flag.summary}</p>
          </div>

          {/* Revisions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Suggested Revisions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Situations</h4>
                <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1">
                  {flag.situations.map((situation, index) => (
                    <li key={index}>{situation}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2 border-l pl-4">
                <h4 className="font-medium text-gray-700">Suggested Instruction</h4>
                <p className="text-sm text-gray-600">
                  {flag.flag_type === "contradiction" ? flag.amendment : flag.suggestion}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Update the FlagIndicator component
const FlagIndicator = ({ flag }: { flag: Flag }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute -left-8 top-0 cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <div className={`rounded-full p-2 ${
          flag.flag_type === "contradiction" 
            ? "bg-red-100 text-red-600" 
            : "bg-yellow-100 text-yellow-600"
        }`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
      </motion.div>
      {showDetails && (
        <FlagDetails flag={flag} onClose={() => setShowDetails(false)} />
      )}
    </>
  );
};

// Add new types
type FlagSummaryRow = {
  id: string;
  flagType: FlagType;
  summary: string;
  situation: string;
  instruction: string;
  isSelected: boolean;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const [showKnowledgeDialog, setShowKnowledgeDialog] = useState(false);
  const [showActionsDialog, setShowActionsDialog] = useState(false);
  const [numTests, setNumTests] = useState([100]); // Slider default value
  const [isConfigured, setIsConfigured] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [flagRows, setFlagRows] = useState<FlagSummaryRow[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectAllContradictions, setSelectAllContradictions] = useState(false);
  const [selectAllUncertainties, setSelectAllUncertainties] = useState(false);
  const ROWS_PER_PAGE = 10;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSimulation = () => {
    const ws = new WebSocket(`${env.NEXT_PUBLIC_BACKEND_DOMAIN.replace('http', 'ws')}/eval`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "start",
        ws_url: `${env.NEXT_PUBLIC_BACKEND_DOMAIN.replace('http', 'ws')}/user_bot`,
        max_messages: numTests[0]
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "message") {
        const newMessage: ChatMessage = {
          role: data.role,
          text: data.text,
          messageId: data.message_id,
          timestamp: formatTime(new Date())
        };
        setMessages(prev => [...prev, newMessage]);
      } else if (data.type === "flag") {
        setMessages(prev => prev.map(msg => 
          msg.messageId === data.message_id 
            ? { ...msg, flag: data as Flag }
            : msg
        ));
        // Add new rows for this flag, spreading out the situations
        const newRows = processFlagIntoRows(data as Flag);
        setFlagRows(prev => [...prev, ...newRows]);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    setIsConfigured(true);
  };

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const ConfigScreen = () => (
    <div className="container mx-auto max-w-2xl p-4">
      <div className="rounded-lg border bg-white shadow p-6 space-y-6">
        <h2 className="text-2xl font-bold text-center mb-8">Tell Us About Your Chatbot</h2>
        
        <div className="space-y-4">
          <button
            onClick={() => setShowRulesDialog(true)}
            className="w-full py-3 px-4 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 font-medium transition-colors"
          >
            Configure Rules
          </button>
          
          <button
            onClick={() => setShowKnowledgeDialog(true)}
            className="w-full py-3 px-4 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 font-medium transition-colors"
          >
            Configure Knowledge
          </button>
          
          <button
            onClick={() => setShowActionsDialog(true)}
            className="w-full py-3 px-4 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 font-medium transition-colors"
          >
            Configure Actions
          </button>
        </div>

        <div className="space-y-2 pt-6">
          <label className="block text-sm font-medium text-gray-700">
            Number of Tests: {numTests[0]}
          </label>
          <Slider
            value={numTests}
            onValueChange={setNumTests}
            min={10}
            max={1000}
            step={10}
            className="w-full"
          />
        </div>

        <button
          onClick={startSimulation}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold transition-colors mt-8"
        >
          Start Simulating
        </button>
      </div>

      {/* Rules Dialog */}
      <SimpleDialog 
        isOpen={showRulesDialog} 
        onClose={() => setShowRulesDialog(false)}
        title="Configure Rules"
      >
        <textarea
          className="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your rules here..."
        />
      </SimpleDialog>

      {/* Knowledge Dialog */}
      <SimpleDialog 
        isOpen={showKnowledgeDialog} 
        onClose={() => setShowKnowledgeDialog(false)}
        title="Configure Knowledge"
      >
        <div className="space-y-4">
          <textarea
            className="w-full h-48 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your knowledge base here..."
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Upload CSV File (optional)
            </label>
            <input
              type="file"
              accept=".csv"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
        </div>
      </SimpleDialog>

      {/* Actions Dialog */}
      <SimpleDialog 
        isOpen={showActionsDialog} 
        onClose={() => setShowActionsDialog(false)}
        title="Configure Actions"
      >
        <textarea
          className="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your actions here..."
        />
      </SimpleDialog>
    </div>
  );

  // Add this function to process flags into rows
  const processFlagIntoRows = (flag: Flag) => {
    return flag.situations.map((situation, index) => ({
      id: `${flag.message_id}-${index}`,
      flagType: flag.flag_type,
      summary: flag.summary,
      situation: situation,
      instruction: flag.flag_type === 'contradiction' ? flag.amendment : flag.suggestion,
      isSelected: false
    }));
  };

  // Add the ExportDialog component
  const ExportDialog = () => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const endIndex = startIndex + ROWS_PER_PAGE;
    const currentRows = flagRows.slice(startIndex, endIndex);
    
    const toggleSelectAll = (type: FlagType) => {
      if (type === 'contradiction') {
        setSelectAllContradictions(!selectAllContradictions);
        setFlagRows(prev => prev.map(row => 
          row.flagType === 'contradiction' 
            ? { ...row, isSelected: !selectAllContradictions }
            : row
        ));
      } else {
        setSelectAllUncertainties(!selectAllUncertainties);
        setFlagRows(prev => prev.map(row => 
          row.flagType === 'uncertain' 
            ? { ...row, isSelected: !selectAllUncertainties }
            : row
        ));
      }
    };

    const toggleRow = (id: string) => {
      setFlagRows(prev => prev.map(row => 
        row.id === id ? { ...row, isSelected: !row.isSelected } : row
      ));
    };

    const exportToCSV = () => {
      const selectedRows = flagRows.filter(row => row.isSelected);
      const csv = [
        ['Flag Type', 'Summary', 'Situation', 'Instruction'],
        ...selectedRows.map(row => [
          row.flagType,
          row.summary,
          row.situation,
          row.instruction
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flag-revisions.csv';
      a.click();
    };

    return (
      <SimpleDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        title="Export Revision Data"
        className="max-w-[800px]"
      >
        <div className="flex flex-col h-full">
          {/* Filter checkboxes - fixed at top */}
          <div className="flex items-center gap-6 pb-4 border-b sticky top-0 bg-white z-10">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectAllContradictions}
                onChange={() => toggleSelectAll('contradiction')}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span>Select All Contradictions</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectAllUncertainties}
                onChange={() => toggleSelectAll('uncertain')}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>Select All Uncertainties</span>
            </label>
            <button
              onClick={exportToCSV}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Export CSV
            </button>
          </div>

          {/* Table container - scrollable */}
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-sm">Select</th>
                  <th className="px-3 py-2 text-left text-sm">Type</th>
                  <th className="px-3 py-2 text-left text-sm w-[200px]">Summary</th>
                  <th className="px-3 py-2 text-left text-sm">Situation</th>
                  <th className="px-3 py-2 text-left text-sm">Instruction</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5">
                      <input
                        type="checkbox"
                        checked={row.isSelected}
                        onChange={() => toggleRow(row.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <AlertTriangle 
                        className={`h-4 w-4 ${
                          row.flagType === 'contradiction' 
                            ? 'text-red-500' 
                            : 'text-yellow-500'
                        }`} 
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="truncate text-sm" title={row.summary}>
                        {row.summary}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-sm">{row.situation}</td>
                    <td className="px-3 py-1.5 text-sm">{row.instruction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination - fixed at bottom */}
          <div className="flex justify-between items-center pt-4 border-t sticky bottom-0 bg-white mt-4">
            <div>
              Showing {startIndex + 1}-{Math.min(endIndex, flagRows.length)} of {flagRows.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={endIndex >= flagRows.length}
                className="px-3 py-1 rounded border disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </SimpleDialog>
    );
  };

  // Add the issues counter box
  const IssuesCounter = () => (
    <div className="fixed right-4 top-20 bg-white rounded-lg shadow-lg p-4 border w-64">
      <h3 className="font-semibold mb-4">Issues Found</h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span>Contradictions</span>
          </div>
          <span className="font-medium">
            {new Set(flagRows.filter(row => row.flagType === 'contradiction')
              .map(row => row.id.split('-')[0])).size}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span>Uncertainties</span>
          </div>
          <span className="font-medium">
            {new Set(flagRows.filter(row => row.flagType === 'uncertain')
              .map(row => row.id.split('-')[0])).size}
          </span>
        </div>
      </div>
      <button
        onClick={() => setShowExportDialog(true)}
        className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Export Revision Data
      </button>
    </div>
  );

  return (
    <Layout>
      {!isConfigured ? (
        <ConfigScreen />
      ) : (
        <div className="flex gap-4 p-4">
          {/* Chat Interface - make narrower */}
          <div className="w-[800px]">
            <div className="rounded-lg border bg-white shadow">
              <div className="border-b p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <h2 className="text-lg font-semibold">Our Simulated Human</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Your AI Bot</h2>
                    <Bot className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </div>

              <div 
                ref={chatContainerRef}
                className="h-[calc(100vh-12rem)] overflow-y-auto p-4"
              >
                <div className="space-y-6">
                  {messages.map((message) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={message.messageId}
                      className={`flex w-full items-end gap-2 ${
                        message.role === "user_bot" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "user_bot" && (
                        <Avatar>
                          <Bot className="h-5 w-5 text-blue-500" />
                        </Avatar>
                      )}
                      
                      <div
                        className={`group relative max-w-[80%] rounded-2xl px-4 py-2.5 ${
                          message.role === "user_bot"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100"
                        }`}
                      >
                        {message.flag && <FlagIndicator flag={message.flag} />}
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <div 
                          className={`mt-1 flex items-center gap-1 text-xs ${
                            message.role === "user_bot" 
                              ? "text-blue-100" 
                              : "text-gray-400"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {message.timestamp}
                        </div>
                      </div>

                      {message.role === "simulation_bot" && (
                        <Avatar>
                          <User className="h-5 w-5 text-gray-500" />
                        </Avatar>
                      )}
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
          </div>

          {/* Issues Counter - now beside chat */}
          <div className="w-[300px] bg-white rounded-lg shadow-lg p-4 border h-fit">
            <h3 className="font-semibold mb-4">Issues Found</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span>Contradictions</span>
                </div>
                <span className="font-medium">
                  {new Set(flagRows.filter(row => row.flagType === 'contradiction')
                    .map(row => row.id.split('-')[0])).size}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span>Uncertainties</span>
                </div>
                <span className="font-medium">
                  {new Set(flagRows.filter(row => row.flagType === 'uncertain')
                    .map(row => row.id.split('-')[0])).size}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowExportDialog(true)}
              className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Export Revision Data
            </button>
          </div>

          {/* Make the export dialog wider and rows more compact */}
          <ExportDialog />
        </div>
      )}
    </Layout>
  );
} 
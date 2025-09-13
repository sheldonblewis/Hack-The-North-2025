export type Message = {
  type: "user_response" | "evaluator_response";
  input: string;
  id: string;
};
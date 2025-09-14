# Evolutionary Prompt Optimization Framework

This directory contains an evolutionary framework for iteratively improving prompts to achieve specific objectives, designed for defensive red-teaming and AI safety research.

## Files

- **`evolutionary_framework.py`** - Core framework implementation
- **`strategy_document.md`** - Comprehensive strategy and implementation guide
- **`test_evolution.py`** - Test script for framework functionality
- **`example_usage.py`** - Example usage patterns and demonstrations
- **`results/`** - Directory for evolution results and outputs

## Quick Start

### Run Basic Test
```bash
cd backend/ML
python test_evolution.py
```

### Run Examples
```bash
python example_usage.py
```

### Use in Your Code
```python
from ML.evolutionary_framework import run_evolutionary_optimization

results = run_evolutionary_optimization(
    objective="your objective here",
    defense_system_prompt="your defense system prompt",
    seed_prompts=["initial", "prompt", "examples"],
    population_size=15,
    max_generations=8
)
```

## Key Components

### `EvolutionaryPromptOptimizer`
Main engine that manages population, evolution, and evaluation cycles.

### `PromptMutator`
Applies various mutation strategies:
- Role-playing injection
- Encoding obfuscation
- Conditional framing
- Multi-step decomposition
- Contradictory instructions
- Tone manipulation
- Context addition

### `DefenseBasedEvaluator`
Evaluates prompts by testing against your `DefenseAgent` and checking if objectives are achieved.

### `PromptCrossover`
Combines successful elements from different prompts to create offspring.

## Ethics & Safety

This framework is designed exclusively for:
- ✅ Defensive security research
- ✅ AI safety evaluation
- ✅ Vulnerability assessment of your own systems
- ✅ Academic research with proper oversight

**NOT for:**
- ❌ Attacking systems you don't own
- ❌ Creating actual harmful content
- ❌ Malicious activities

## Results

Evolution results are saved as JSON files containing:
- Best individual prompt and fitness
- Complete population evolution history
- Generation statistics and performance metrics
- Detailed mutation lineages and metadata

Check the `results/` directory after running experiments.
import { Injectable } from '@nestjs/common';
import { ExecutionContext } from '@n9n/shared';

@Injectable()
export class ContextService {
  /**
   * Interpolate template string with variables
   * Example: "Hello {{variables.name}}" -> "Hello John"
   */
  interpolate(template: string, context: ExecutionContext): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getValueByPath(context, path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Evaluate expression against context
   * Example: "variables.selectedOption === '2'"
   */
  evaluateExpression(expression: string, context: ExecutionContext): boolean {
    try {
      // Create safe evaluation context
      const safeContext = {
        variables: context.variables,
        globals: context.globals,
        input: context.input,
        output: context.output,
      };

      // Use Function constructor for safe evaluation
      const func = new Function(
        'variables',
        'globals',
        'input',
        'output',
        `return ${expression}`,
      );

      return func(
        safeContext.variables,
        safeContext.globals,
        safeContext.input,
        safeContext.output,
      );
    } catch (error) {
      console.error('Expression evaluation error:', error);
      return false;
    }
  }

  /**
   * Set variable in context
   */
  setVariable(context: ExecutionContext, key: string, value: any): void {
    context.variables[key] = value;
  }

  /**
   * Get variable from context
   */
  getVariable(context: ExecutionContext, key: string): any {
    return context.variables[key];
  }

  /**
   * Set input for current node
   */
  setInput(context: ExecutionContext, data: Record<string, any>): void {
    context.input = data;
  }

  /**
   * Set output from current node
   */
  setOutput(context: ExecutionContext, data: Record<string, any>): void {
    context.output = data;
  }

  /**
   * Get value by path (e.g., "variables.user.name")
   */
  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}


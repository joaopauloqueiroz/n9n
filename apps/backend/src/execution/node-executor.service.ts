import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WorkflowNode,
  WorkflowNodeType,
  ExecutionContext,
  SendMessageConfig,
  ConditionConfig,
  WaitReplyConfig,
  EndConfig,
} from '@n9n/shared';
import { ContextService } from './context.service';

export interface NodeExecutionResult {
  nextNodeId: string | null;
  shouldWait: boolean;
  waitTimeoutSeconds?: number;
  onTimeout?: 'END' | 'GOTO_NODE';
  timeoutTargetNodeId?: string;
  output?: Record<string, any>;
  messageToSend?: {
    sessionId: string;
    contactId: string;
    message: string;
  };
}

@Injectable()
export class NodeExecutorService {
  constructor(
    private contextService: ContextService,
    private configService: ConfigService,
  ) {}

  /**
   * Execute a node and return the result
   */
  async executeNode(
    node: WorkflowNode,
    context: ExecutionContext,
    edges: any[],
    sessionId?: string,
    contactId?: string,
  ): Promise<NodeExecutionResult> {
    switch (node.type) {
      case WorkflowNodeType.SEND_MESSAGE:
        return this.executeSendMessage(node, context, edges, sessionId, contactId);

      case WorkflowNodeType.CONDITION:
        return this.executeCondition(node, context, edges);

      case WorkflowNodeType.WAIT_REPLY:
        return this.executeWaitReply(node, context, edges);

      case WorkflowNodeType.END:
        return this.executeEnd(node, context);

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Execute SEND_MESSAGE node
   */
  private async executeSendMessage(
    node: WorkflowNode,
    context: ExecutionContext,
    edges: any[],
    sessionId?: string,
    contactId?: string,
  ): Promise<NodeExecutionResult> {
    const config = node.config as SendMessageConfig;

    // Interpolate message with variables
    const message = this.contextService.interpolate(config.message, context);

    // Store message in output
    this.contextService.setOutput(context, { message });

    // Add delay if configured
    if (config.delay) {
      await new Promise((resolve) => setTimeout(resolve, config.delay));
    }

    // Find next node
    const nextEdge = edges.find((e) => e.source === node.id);
    const nextNodeId = nextEdge ? nextEdge.target : null;

    return {
      nextNodeId,
      shouldWait: false,
      messageToSend: sessionId && contactId ? {
        sessionId,
        contactId,
        message,
      } : undefined,
    };
  }

  /**
   * Execute CONDITION node
   */
  private executeCondition(
    node: WorkflowNode,
    context: ExecutionContext,
    edges: any[],
  ): NodeExecutionResult {
    const config = node.config as ConditionConfig;

    // Evaluate expression
    const result = this.contextService.evaluateExpression(config.expression, context);

    // Store result in output
    this.contextService.setOutput(context, { conditionResult: result });

    // Find next node based on condition
    const nextEdge = edges.find(
      (e) => e.source === node.id && e.label === (result ? 'true' : 'false'),
    );

    const nextNodeId = nextEdge ? nextEdge.target : null;

    return {
      nextNodeId,
      shouldWait: false,
    };
  }

  /**
   * Execute WAIT_REPLY node
   */
  private executeWaitReply(
    node: WorkflowNode,
    context: ExecutionContext,
    edges: any[],
  ): NodeExecutionResult {
    const config = node.config as WaitReplyConfig;

    const timeoutSeconds =
      config.timeoutSeconds ||
      this.configService.get('WAIT_REPLY_DEFAULT_TIMEOUT_SECONDS', 300);

    // Find next node (will be used when resumed)
    const nextEdge = edges.find((e) => e.source === node.id);
    const nextNodeId = nextEdge ? nextEdge.target : null;

    return {
      nextNodeId,
      shouldWait: true,
      waitTimeoutSeconds: timeoutSeconds,
      onTimeout: config.onTimeout,
      timeoutTargetNodeId: config.timeoutTargetNodeId,
    };
  }

  /**
   * Execute END node
   */
  private executeEnd(node: WorkflowNode, context: ExecutionContext): NodeExecutionResult {
    const config = node.config as EndConfig;

    // Prepare final output
    const output: Record<string, any> = {};

    if (config.outputVariables) {
      config.outputVariables.forEach((varName) => {
        output[varName] = this.contextService.getVariable(context, varName);
      });
    }

    this.contextService.setOutput(context, output);

    return {
      nextNodeId: null,
      shouldWait: false,
      output,
    };
  }

  /**
   * Process user reply for WAIT_REPLY node
   */
  processReply(
    node: WorkflowNode,
    message: string,
    context: ExecutionContext,
  ): void {
    const config = node.config as WaitReplyConfig;

    // Save reply to variable
    this.contextService.setVariable(context, config.saveAs, message);
  }
}


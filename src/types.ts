export interface ScriptEvent {
    id: string;
    name: string;
    type: 'event' | 'trigger' | 'action';
    children: ScriptEvent[];
    attributes: Record<string, string>;
    content?: string;
}

export interface MissionData {
    events: ScriptEvent[];
    metadata: {
        version?: string;
        description?: string;
    };
}

export interface ParsedSWTFile {
    filePath: string;
    content: string;
    parsed: MissionData;
}

// Common SWT element types based on your project knowledge
export type SWTElementType =
    | 'Event'
    | 'Trigger'
    | 'Action'
    | 'Condition'
    | 'Param'
    | 'Zone'
    | 'Unit'
    | 'Timer';

export interface SWTElement {
    tagName: string;
    attributes: Record<string, string>;
    children: SWTElement[];
    textContent?: string;
    parent?: SWTElement;
}

// Action types found in the project knowledge
export type ActionType =
    | 'a_killUnit'
    | 'a_spawnUnitGroupToZone'
    | 'a_setTimer'
    | 'a_showMessage'
    | 'a_playSound'
    | 'a_enableTrigger'
    | 'a_disableTrigger';

export interface FlowChartNode {
    id: string;
    type: 'event' | 'trigger' | 'action' | 'condition';
    label: string;
    x: number;
    y: number;
    connections: string[];
}

import { ScriptEvent, MissionData, SWTElement } from './types';

export class SWTParser {

    static parseXML(content: string): MissionData {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/xml');

        // Check for parse errors
        const parserError = doc.querySelector('parsererror');
        if (parserError) {
            throw new Error(`XML Parse Error: ${parserError.textContent}`);
        }

        const events = this.extractEvents(doc.documentElement);
        const metadata = this.extractMetadata(doc.documentElement);

        return { events, metadata };
    }

    private static extractEvents(element: Element): ScriptEvent[] {
        const events: ScriptEvent[] = [];

        this.traverseElement(element, (el) => {
            if (this.isScriptEvent(el)) {
                const event = this.elementToScriptEvent(el);
                events.push(event);
            }
        });

        return events;
    }

    private static isScriptEvent(element: Element): boolean {
        const eventTags = ['Event', 'Trigger', 'Action', 'Condition', 'Timer'];
        return eventTags.includes(element.tagName);
    }

    private static elementToScriptEvent(element: Element): ScriptEvent {
        const id = this.generateId();
        const name = element.getAttribute('name') ||
            element.querySelector('n')?.textContent ||
            element.tagName;

        const type = this.getEventType(element.tagName);
        const attributes = this.extractAttributes(element);
        const children = this.extractChildEvents(element);
        const content = this.extractTextContent(element);

        return { id, name, type, attributes, children, content };
    }

    private static getEventType(tagName: string): 'event' | 'trigger' | 'action' {
        switch (tagName.toLowerCase()) {
            case 'trigger':
            case 'condition':
                return 'trigger';
            case 'action':
                return 'action';
            default:
                return 'event';
        }
    }

    private static extractAttributes(element: Element): Record<string, string> {
        const attrs: Record<string, string> = {};

        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            attrs[attr.name] = attr.value;
        }

        // Also extract special child elements like <n> and <Param>
        const nameEl = element.querySelector('n');
        if (nameEl?.textContent) {
            attrs.actionName = nameEl.textContent;
        }

        const params = element.querySelectorAll('Param');
        params.forEach((param, index) => {
            if (param.textContent) {
                attrs[`param${index + 1}`] = param.textContent;
            }
        });

        return attrs;
    }

    private static extractChildEvents(element: Element): ScriptEvent[] {
        const children: ScriptEvent[] = [];

        for (let i = 0; i < element.children.length; i++) {
            const child = element.children[i];
            if (this.isScriptEvent(child)) {
                children.push(this.elementToScriptEvent(child));
            }
        }

        return children;
    }

    private static extractTextContent(element: Element): string | undefined {
        // Get direct text content, excluding child elements
        const textNodes = Array.from(element.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent?.trim())
            .filter(text => text && text.length > 0);

        return textNodes.length > 0 ? textNodes.join(' ') : undefined;
    }

    private static extractMetadata(root: Element): { version?: string; description?: string } {
        const version = root.getAttribute('version');
        const description = root.querySelector('Description')?.textContent;

        return { version, description };
    }

    private static traverseElement(element: Element, callback: (el: Element) => void): void {
        callback(element);

        for (let i = 0; i < element.children.length; i++) {
            this.traverseElement(element.children[i], callback);
        }
    }

    private static generateId(): string {
        return `evt_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Convert back to XML
    static toXML(data: MissionData): string {
        const doc = document.implementation.createDocument('', '', null);
        const root = doc.createElement('Mission');

        if (data.metadata.version) {
            root.setAttribute('version', data.metadata.version);
        }

        if (data.metadata.description) {
            const desc = doc.createElement('Description');
            desc.textContent = data.metadata.description;
            root.appendChild(desc);
        }

        data.events.forEach(event => {
            const element = this.scriptEventToElement(event, doc);
            root.appendChild(element);
        });

        doc.appendChild(root);

        const serializer = new XMLSerializer();
        let xmlString = serializer.serializeToString(doc);

        // Format XML with proper indentation
        return this.formatXML(xmlString);
    }

    private static scriptEventToElement(event: ScriptEvent, doc: Document): Element {
        const element = doc.createElement(this.getTagName(event));

        // Set attributes
        Object.entries(event.attributes).forEach(([key, value]) => {
            if (key === 'actionName') {
                const nameEl = doc.createElement('n');
                nameEl.textContent = value;
                element.appendChild(nameEl);
            } else if (key.startsWith('param')) {
                const paramEl = doc.createElement('Param');
                paramEl.textContent = value;
                element.appendChild(paramEl);
            } else {
                element.setAttribute(key, value);
            }
        });

        // Add text content
        if (event.content) {
            element.appendChild(doc.createTextNode(event.content));
        }

        // Add children
        event.children.forEach(child => {
            const childElement = this.scriptEventToElement(child, doc);
            element.appendChild(childElement);
        });

        return element;
    }

    private static getTagName(event: ScriptEvent): string {
        switch (event.type) {
            case 'trigger':
                return 'Trigger';
            case 'action':
                return 'Action';
            default:
                return 'Event';
        }
    }

    private static formatXML(xml: string): string {
        const PADDING = '  ';
        const reg = /(>)(<)(\/*)/g;
        let formatted = xml.replace(reg, '$1\n$2$3');

        let pad = 0;
        return formatted.split('\n').map(line => {
            let indent = 0;
            if (line.match(/.+<\/\w[^>]*>$/)) {
                indent = 0;
            } else if (line.match(/^<\/\w/) && pad > 0) {
                pad -= 1;
            } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
                indent = 1;
            } else {
                indent = 0;
            }

            const padding = PADDING.repeat(pad);
            pad += indent;
            return padding + line;
        }).join('\n');
    }
}

import React, { useState, useCallback } from 'react';
import { File, Save, Plus, Trash2, Edit3, ChevronRight, ChevronDown } from 'lucide-react';
import { ScriptEvent, MissionData, ParsedSWTFile } from './types';
import { SWTParser } from './parser';
import './App.css';

export default function App() {
    const [currentFile, setCurrentFile] = useState<ParsedSWTFile | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<ScriptEvent | null>(null);
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

    const openFile = useCallback(async () => {
        try {
            if (!window.electronAPI) {
                alert('File operations are only available in the Electron app');
                return;
            }
            const result = await window.electronAPI.openSWTFile();
            if (result.success && result.content && result.filePath) {
                const parsed = SWTParser.parseXML(result.content);
                setCurrentFile({
                    filePath: result.filePath,
                    content: result.content,
                    parsed
                });
                setSelectedEvent(null);
            } else {
                alert(`Failed to open file: ${result.error}`);
            }
        } catch (error) {
            alert(`Error opening file: ${error}`);
        }
    }, []);

    const saveFile = useCallback(async () => {
        if (!currentFile) return;

        try {
            if (!window.electronAPI) {
                alert('File operations are only available in the Electron app');
                return;
            }
            const xmlContent = SWTParser.toXML(currentFile.parsed);
            const result = await window.electronAPI.saveSWTFile(currentFile.filePath, xmlContent);

            if (result.success) {
                alert('File saved successfully!');
            } else {
                alert(`Failed to save file: ${result.error}`);
            }
        } catch (error) {
            alert(`Error saving file: ${error}`);
        }
    }, [currentFile]);

    const saveAsFile = useCallback(async () => {
        if (!currentFile) return;

        try {
            if (!window.electronAPI) {
                alert('File operations are only available in the Electron app');
                return;
            }
            const xmlContent = SWTParser.toXML(currentFile.parsed);
            const result = await window.electronAPI.saveSWTFileAs(xmlContent);

            if (result.success && result.filePath) {
                setCurrentFile(prev => prev ? { ...prev, filePath: result.filePath! } : null);
                alert('File saved successfully!');
            } else {
                alert(`Failed to save file: ${result.error}`);
            }
        } catch (error) {
            alert(`Error saving file: ${error}`);
        }
    }, [currentFile]);

    const toggleExpanded = useCallback((eventId: string) => {
        setExpandedEvents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(eventId)) {
                newSet.delete(eventId);
            } else {
                newSet.add(eventId);
            }
            return newSet;
        });
    }, []);

    const addEvent = useCallback(() => {
        if (!currentFile) return;

        const newEvent: ScriptEvent = {
            id: `evt_${Date.now()}`,
            name: 'New Event',
            type: 'event',
            children: [],
            attributes: {}
        };

        setCurrentFile(prev => prev ? {
            ...prev,
            parsed: {
                ...prev.parsed,
                events: [...prev.parsed.events, newEvent]
            }
        } : null);
    }, [currentFile]);

    const updateEvent = useCallback((eventId: string, updates: Partial<ScriptEvent>) => {
        if (!currentFile) return;

        const updateEventRecursive = (events: ScriptEvent[]): ScriptEvent[] => {
            return events.map(event => {
                if (event.id === eventId) {
                    return { ...event, ...updates };
                }
                return {
                    ...event,
                    children: updateEventRecursive(event.children)
                };
            });
        };

        setCurrentFile(prev => prev ? {
            ...prev,
            parsed: {
                ...prev.parsed,
                events: updateEventRecursive(prev.parsed.events)
            }
        } : null);
    }, [currentFile]);

    const deleteEvent = useCallback((eventId: string) => {
        if (!currentFile) return;

        const deleteEventRecursive = (events: ScriptEvent[]): ScriptEvent[] => {
            return events.filter(event => event.id !== eventId).map(event => ({
                ...event,
                children: deleteEventRecursive(event.children)
            }));
        };

        setCurrentFile(prev => prev ? {
            ...prev,
            parsed: {
                ...prev.parsed,
                events: deleteEventRecursive(prev.parsed.events)
            }
        } : null);

        if (selectedEvent?.id === eventId) {
            setSelectedEvent(null);
        }
    }, [currentFile, selectedEvent]);

    return (
        <div className="app">
            <header className="toolbar">
                <button onClick={openFile} className="btn">
                    <File size={16} />
                    Open SWT
                </button>
                <button onClick={saveFile} disabled={!currentFile} className="btn">
                    <Save size={16} />
                    Save
                </button>
                <button onClick={saveAsFile} disabled={!currentFile} className="btn">
                    <Save size={16} />
                    Save As
                </button>
                <div className="separator" />
                <button onClick={addEvent} disabled={!currentFile} className="btn">
                    <Plus size={16} />
                    Add Event
                </button>
            </header>

            <main className="main-content">
                <div className="sidebar">
                    <h3>Mission Events</h3>
                    {currentFile ? (
                        <EventTree
                            events={currentFile.parsed.events}
                            selectedEvent={selectedEvent}
                            expandedEvents={expandedEvents}
                            onSelect={setSelectedEvent}
                            onToggleExpanded={toggleExpanded}
                            onDelete={deleteEvent}
                        />
                    ) : (
                        <p className="empty-state">Open an SWT file to start editing</p>
                    )}
                </div>

                <div className="content">
                    {selectedEvent ? (
                        <EventEditor
                            event={selectedEvent}
                            onUpdate={(updates) => updateEvent(selectedEvent.id, updates)}
                        />
                    ) : (
                        <div className="empty-state">
                            {currentFile ?
                                'Select an event from the tree to edit' :
                                'Open an SWT file to get started'
                            }
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

interface EventTreeProps {
    events: ScriptEvent[];
    selectedEvent: ScriptEvent | null;
    expandedEvents: Set<string>;
    onSelect: (event: ScriptEvent) => void;
    onToggleExpanded: (eventId: string) => void;
    onDelete: (eventId: string) => void;
}

function EventTree({ events, selectedEvent, expandedEvents, onSelect, onToggleExpanded, onDelete }: EventTreeProps) {
    return (
        <div className="event-tree">
            {events.map(event => (
                <EventTreeItem
                    key={event.id}
                    event={event}
                    selectedEvent={selectedEvent}
                    expandedEvents={expandedEvents}
                    onSelect={onSelect}
                    onToggleExpanded={onToggleExpanded}
                    onDelete={onDelete}
                    level={0}
                />
            ))}
        </div>
    );
}

interface EventTreeItemProps extends EventTreeProps {
    event: ScriptEvent;
    level: number;
}

function EventTreeItem({ event, selectedEvent, expandedEvents, onSelect, onToggleExpanded, onDelete, level }: EventTreeItemProps) {
    const isExpanded = expandedEvents.has(event.id);
    const isSelected = selectedEvent?.id === event.id;
    const hasChildren = event.children.length > 0;

    return (
        <div className="event-tree-item">
            <div
                className={`event-item ${isSelected ? 'selected' : ''}`}
                style={{ paddingLeft: `${level * 20 + 8}px` }}
            >
                <button
                    className="expand-btn"
                    onClick={() => onToggleExpanded(event.id)}
                    disabled={!hasChildren}
                >
                    {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span style={{ width: 14 }} />}
                </button>

                <span
                    className={`event-name event-type-${event.type}`}
                    onClick={() => onSelect(event)}
                >
                    {event.name}
                </span>

                <button
                    className="delete-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(event.id);
                    }}
                >
                    <Trash2 size={12} />
                </button>
            </div>

            {isExpanded && hasChildren && (
                <div className="event-children">
                    {event.children.map(child => (
                        <EventTreeItem
                            key={child.id}
                            event={child}
                            selectedEvent={selectedEvent}
                            expandedEvents={expandedEvents}
                            onSelect={onSelect}
                            onToggleExpanded={onToggleExpanded}
                            onDelete={onDelete}
                            level={level + 1}
                            events={[]}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface EventEditorProps {
    event: ScriptEvent;
    onUpdate: (updates: Partial<ScriptEvent>) => void;
}

function EventEditor({ event, onUpdate }: EventEditorProps) {
    return (
        <div className="event-editor">
            <h2>
                <Edit3 size={20} />
                Edit Event
            </h2>

            <div className="form-group">
                <label>Name:</label>
                <input
                    type="text"
                    value={event.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                />
            </div>

            <div className="form-group">
                <label>Type:</label>
                <select
                    value={event.type}
                    onChange={(e) => onUpdate({ type: e.target.value as any })}
                >
                    <option value="event">Event</option>
                    <option value="trigger">Trigger</option>
                    <option value="action">Action</option>
                </select>
            </div>

            {event.content && (
                <div className="form-group">
                    <label>Content:</label>
                    <textarea
                        value={event.content}
                        onChange={(e) => onUpdate({ content: e.target.value })}
                        rows={3}
                    />
                </div>
            )}

            <div className="form-group">
                <label>Attributes:</label>
                <div className="attributes-list">
                    {Object.entries(event.attributes).map(([key, value]) => (
                        <div key={key} className="attribute-row">
                            <input
                                type="text"
                                value={key}
                                onChange={(e) => {
                                    const newAttrs = { ...event.attributes };
                                    delete newAttrs[key];
                                    newAttrs[e.target.value] = value;
                                    onUpdate({ attributes: newAttrs });
                                }}
                                placeholder="Attribute name"
                            />
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => {
                                    onUpdate({
                                        attributes: { ...event.attributes, [key]: e.target.value }
                                    });
                                }}
                                placeholder="Attribute value"
                            />
                            <button
                                onClick={() => {
                                    const newAttrs = { ...event.attributes };
                                    delete newAttrs[key];
                                    onUpdate({ attributes: newAttrs });
                                }}
                                className="delete-attr-btn"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => {
                            onUpdate({
                                attributes: { ...event.attributes, '': '' }
                            });
                        }}
                        className="add-attr-btn"
                    >
                        <Plus size={14} />
                        Add Attribute
                    </button>
                </div>
            </div>

            <div className="event-info">
                <p><strong>Children:</strong> {event.children.length}</p>
                <p><strong>ID:</strong> {event.id}</p>
            </div>
        </div>
    );
}

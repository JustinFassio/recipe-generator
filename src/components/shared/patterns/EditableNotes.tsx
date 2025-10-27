import { useState, useEffect } from 'react';
import { Edit, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface EditableNotesProps {
  notes: string | null;
  onSave: (notes: string) => Promise<void>;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
  showEditButton?: boolean;
}

export function EditableNotes({
  notes,
  onSave,
  placeholder = 'Additional notes, tips, or variations...',
  rows = 3,
  className = '',
  disabled = false,
  showEditButton = true,
}: EditableNotesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync editedNotes when notes prop changes
  useEffect(() => {
    setEditedNotes(notes || '');
  }, [notes]);

  const handleEdit = () => {
    setEditedNotes(notes || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(editedNotes);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedNotes(notes || '');
    setIsEditing(false);
  };

  const formatNotesForDisplay = (notesText: string) => {
    return notesText.split('\n').map((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) return null;

      // Check if it's a section header (starts with **)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        return (
          <div key={index} className="mt-4 first:mt-0">
            <h5 className="text-base font-semibold text-gray-800">
              {trimmedLine.replace(/\*\*/g, '')}
            </h5>
          </div>
        );
      }

      // Check if it's a bullet point
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        return (
          <div key={index} className="flex items-start">
            <div className="mt-2 mr-3 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400"></div>
            <p className="text-sm leading-relaxed text-gray-800">
              {trimmedLine.replace(/^[•-]\s*/, '')}
            </p>
          </div>
        );
      }

      // Regular paragraph
      return (
        <p key={index} className="text-sm leading-relaxed text-gray-800">
          {trimmedLine}
        </p>
      );
    });
  };

  return (
    <div className={`mt-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold text-gray-900">Notes</h4>
        {showEditButton && !isEditing && !disabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            variant="default"
            size="md"
            className="w-full resize-none"
            disabled={disabled}
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving || disabled}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || disabled}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        notes && <div className="space-y-2">{formatNotesForDisplay(notes)}</div>
      )}
    </div>
  );
}

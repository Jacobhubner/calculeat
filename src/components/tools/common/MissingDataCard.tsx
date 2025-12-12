import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Profile } from '@/lib/types';
import QuickProfileInput from './QuickProfileInput';

interface MissingDataCardProps {
  title?: string;
  description?: string;
  missingFields: Array<{
    key: keyof Profile;
    label: string;
    type?: 'number' | 'date' | 'select';
    options?: Array<{ label: string; value: string | number }>;
  }>;
  onSave: (data: Partial<Profile>) => Promise<void>;
}

export default function MissingDataCard({
  title = 'Saknade uppgifter',
  description = 'För att använda detta verktyg behöver du fylla i följande uppgifter:',
  missingFields,
  onSave,
}: MissingDataCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (missingFields.length === 0) return null;

  const handleSave = async (fieldData: Partial<Profile>) => {
    setIsSaving(true);
    try {
      await onSave(fieldData);
      // Automatically collapse after successful save
      setIsExpanded(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <CardTitle className="text-orange-900">{title}</CardTitle>
              <CardDescription className="text-orange-700 mt-1">{description}</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-orange-700 hover:text-orange-900 hover:bg-orange-100"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Dölj
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Fyll i
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {missingFields.map(field => (
              <QuickProfileInput
                key={field.key}
                field={field.key}
                label={field.label}
                type={field.type}
                options={field.options}
                onSave={handleSave}
                disabled={isSaving}
              />
            ))}
          </div>
        </CardContent>
      )}

      {!isExpanded && (
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
            {missingFields.map(field => (
              <li key={field.key}>{field.label}</li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}

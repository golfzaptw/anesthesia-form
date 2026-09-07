import type { FormConfig } from "@/lib/formData";
import type { FormId, StoredSubmission, UserSummary } from "@/types";
import type { InstructorStat, StaffFeedback, ScoreStat, CommentEntry } from "@/lib/analytics";

export interface AdminTabProps {
  config: FormConfig | null;
  analysisConfig: FormConfig | null;
  submissions: StoredSubmission[];
  users: UserSummary[];
  batchUsers: UserSummary[];
  activeBatch: number;
  isViewingCurrentBatch: boolean;
  byForm: Record<FormId, StoredSubmission[]>;
  
  // Analytics results
  form1: { scores: ScoreStat[]; comments: CommentEntry[] };
  form2: InstructorStat[];
  form3: StaffFeedback[];
  form1Avg: number;
  
  // Actions
  onExport: (formId: FormId) => void;
  onExportSummary?: () => void;
  onDownloadAll?: () => void;
  onGeneratePDF?: () => void;
  isGeneratingPDF?: boolean;
  onSetUserToDelete?: (user: UserSummary) => void;
  onBackfillSnapshots?: () => void;
  onMigrateSubmissions?: () => void;
  isBackfilling?: boolean;
  isMigrating?: boolean;
}

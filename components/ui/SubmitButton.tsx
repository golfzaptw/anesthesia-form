import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  loading: boolean;
  label?: string;
  loadingLabel?: string;
}

export function SubmitButton({
  loading,
  label = "ส่งแบบประเมิน",
  loadingLabel = "กำลังส่ง...",
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}

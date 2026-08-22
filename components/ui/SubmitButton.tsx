import { Loader2, Send } from "lucide-react";

interface SubmitButtonProps {
  loading: boolean;
  label?: string;
  loadingLabel?: string;
  disabled?: boolean;
}

export function SubmitButton({
  loading,
  label = "ส่งแบบประเมิน",
  loadingLabel = "กำลังส่งแบบประเมิน...",
  disabled = false,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={`w-full py-3.5 px-6 font-bold rounded-2xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-base select-none ${
        disabled
          ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
          : loading
          ? "bg-blue-600 text-white opacity-80 cursor-wait"
          : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.99]"
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <Send className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

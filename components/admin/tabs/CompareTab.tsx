import { useState, useEffect, useMemo } from "react";
import { getAllSubmissions, getBatchConfigSnapshot } from "@/lib/firestore";
import { analyseForm1, analyseForm2 } from "@/lib/analytics";
import { BarSeries, type BarData } from "../BarSeries";
import type { AdminTabProps } from "./types";
import type { FormConfig } from "@/lib/formData";

interface BatchStats {
  batchId: number;
  batchName: string;
  form1: ReturnType<typeof analyseForm1>;
  form2: ReturnType<typeof analyseForm2>;
}

export function CompareTab({ config }: AdminTabProps) {
  const [stats, setStats] = useState<BatchStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!config?.batches) return;
    
    async function loadData() {
      setLoading(true);
      try {
        const results = await Promise.all(
          config!.batches!.map(async (b) => {
            const subs = await getAllSubmissions(b.id);
            const snapshot = await getBatchConfigSnapshot(b.id);
            
            const batchConfig: FormConfig = snapshot ? { 
              ...config!,
              form1Questions: snapshot.form1Questions,
              form2Instructors: snapshot.form2Instructors,
              form2Questions: snapshot.form2Questions,
            } : config!;

            const form1Subs = subs.filter(s => s.formId === "form_1");
            const form2Subs = subs.filter(s => s.formId === "form_2");

            const f1 = analyseForm1(form1Subs, batchConfig);
            const f2 = analyseForm2(form2Subs, batchConfig);
            
            return {
              batchId: b.id,
              batchName: b.label || `รุ่นที่ ${b.id}`,
              form1: f1,
              form2: f2
            };
          })
        );
        results.sort((a, b) => a.batchId - b.batchId);
        setStats(results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [config]);

  const form1Trends = useMemo(() => {
    const questions = config?.form1Questions || [];
    return questions.map((q: string) => {
      const barData: BarData[] = stats.map(s => {
        // match by label in case ID changed
        const stat = s.form1.scores.find(score => score.label === q);
        return {
          label: s.batchName,
          value: stat?.average || 0
        };
      });
      return { question: q, data: barData };
    });
  }, [config?.form1Questions, stats]);

  const form2Trends = useMemo(() => {
    const instructors = config?.form2Instructors || [];
    return instructors.map((insName: string) => {
      const barData: BarData[] = stats.map(s => {
        const stat = s.form2.find(instructor => instructor.name === insName);
        return {
          label: s.batchName,
          value: stat?.overallAverage || 0
        };
      });
      return { instructorName: insName, data: barData };
    });
  }, [config?.form2Instructors, stats]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 text-sm">กำลังดึงข้อมูลเปรียบเทียบทุกรุ่น...</div>;
  }

  if (stats.length === 0) {
    return <div className="p-8 text-center text-gray-500 text-sm">ไม่มีข้อมูล</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-sm text-gray-800 mb-4">แนวโน้มคะแนนเฉลี่ยรายข้อ (ชุดที่ 1)</h2>
        <div className="space-y-8">
          {form1Trends.map((trend, idx) => (
            <div key={idx} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <p className="text-sm font-medium text-gray-700 mb-4 line-clamp-2" title={trend.question}>
                {trend.question}
              </p>
              <BarSeries data={trend.data} height={120} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-sm text-gray-800 mb-4">แนวโน้มคะแนนเฉลี่ยรายบุคคล (ชุดที่ 2)</h2>
        <div className="space-y-8">
          {form2Trends.map((trend, idx) => (
            <div key={idx} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <p className="text-sm font-medium text-gray-700 mb-4">{trend.instructorName}</p>
              <BarSeries data={trend.data} height={120} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

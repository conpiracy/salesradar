"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";

export default function LessonsPage() {
  const [adminKey, setAdminKey] = useState("");
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [certifyResult, setCertifyResult] = useState<any>(null);

  const lessons = useQuery(api.courses.listLessons);
  const completions = useQuery(
    api.courses.getSellerCompletions,
    adminKey ? { adminKey } : "skip"
  );
  const completeLesson = useMutation(api.courses.completeLesson);
  const certifyIfEligible = useMutation(api.courses.certifyIfEligible);

  useEffect(() => {
    // Load adminKey from localStorage in DEV_MODE
    if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
      const stored = localStorage.getItem("adminKey");
      if (stored) {
        setAdminKey(stored);
      }
    }
  }, []);

  useEffect(() => {
    if (completions) {
      setCompletedIds(new Set(completions.map((id: any) => id)));
    }
  }, [completions]);

  const handleComplete = async (lessonId: Id<"lessons">) => {
    if (!adminKey) {
      alert("Please enter your admin key first");
      return;
    }

    try {
      await completeLesson({ adminKey, lessonId });
      // Refresh will happen automatically via Convex reactivity
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCertify = async () => {
    if (!adminKey) {
      alert("Please enter your admin key first");
      return;
    }

    try {
      const result = await certifyIfEligible({ adminKey });
      setCertifyResult(result);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <main className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Lessons</h1>
      <p className="mb-6 text-gray-600">
        Complete all lessons to become certified.
      </p>

      <div className="mb-6 bg-gray-50 p-4 rounded">
        <label className="block font-semibold mb-2">Admin Key</label>
        <input
          type="text"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          placeholder="sk_..."
          className="w-full border rounded px-4 py-2 font-mono text-sm"
        />
        {process.env.NEXT_PUBLIC_DEV_MODE === "true" && adminKey && (
          <p className="text-xs text-green-600 mt-1">
            ✓ Loaded from localStorage
          </p>
        )}
      </div>

      {certifyResult && (
        <div className={`p-4 rounded mb-6 ${certifyResult.certified ? 'bg-green-50 border border-green-500' : 'bg-yellow-50 border border-yellow-500'}`}>
          <p className={certifyResult.certified ? 'text-green-700' : 'text-yellow-700'}>
            {certifyResult.message}
          </p>
        </div>
      )}

      {!lessons ? (
        <p>Loading lessons...</p>
      ) : lessons.length === 0 ? (
        <p>No lessons available. Run the seed script first!</p>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {lessons.map((lesson: any) => {
              const isCompleted = completedIds.has(lesson._id);
              return (
                <div
                  key={lesson._id}
                  className={`border rounded-lg p-6 ${
                    isCompleted ? "bg-green-50 border-green-500" : "bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-semibold">
                      {lesson.order}. {lesson.title}
                      {isCompleted && <span className="ml-2 text-green-600">✓</span>}
                    </h2>
                    {!isCompleted && (
                      <button
                        onClick={() => handleComplete(lesson._id)}
                        disabled={!adminKey}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{lesson.content}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={handleCertify}
              disabled={!adminKey}
              className="bg-green-600 text-white px-8 py-3 rounded hover:bg-green-700 disabled:bg-gray-400 font-semibold"
            >
              Check Certification Status
            </button>
          </div>
        </>
      )}
    </main>
  );
}

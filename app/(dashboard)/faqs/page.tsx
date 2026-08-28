"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Faq {
  _id: string;
  question: string;
  answer: string;
  isActive: boolean;
}

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const loadFaqs = async () => {
    const response = await axios.get("/api/faq?admin=true");
    setFaqs(response.data.faqs || []);
  };

  useEffect(() => {
    loadFaqs().catch(() => setError("Failed to load FAQs"));
  }, []);

  const addFaq = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await axios.post("/api/faq", { question, answer });
      setQuestion("");
      setAnswer("");
      await loadFaqs();
    } catch {
      setError("Question and answer are required");
    }
  };

  const toggleFaq = async (faq: Faq) => {
    await axios.put(`/api/faq/${faq._id}`, { isActive: !faq.isActive });
    setFaqs((items) =>
      items.map((item) =>
        item._id === faq._id ? { ...item, isActive: !item.isActive } : item,
      ),
    );
  };

  const deleteFaq = async (id: string) => {
    if (!window.confirm("Delete this FAQ?")) return;
    await axios.delete(`/api/faq/${id}`);
    setFaqs((items) => items.filter((item) => item._id !== id));
  };

  return (
    <main className="space-y-6 p-4 pt-20 md:p-6 md:pt-6">
      <h1 className="text-2xl font-bold text-pink-700">FAQs</h1>
      <form onSubmit={addFaq} className="space-y-3 rounded border bg-white p-4">
        <input
          className="w-full rounded border p-2"
          placeholder="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <textarea
          className="min-h-28 w-full rounded border p-2"
          placeholder="Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <button
          className="rounded bg-pink-600 px-4 py-2 text-white"
          type="submit"
        >
          Add FAQ
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>
      <div className="space-y-3">
        {faqs.map((faq) => (
          <div
            className="flex items-start justify-between gap-4 rounded border bg-white p-4"
            key={faq._id}
          >
            <div>
              <h2 className="font-semibold">{faq.question}</h2>
              <p className="mt-1 text-sm text-gray-600">{faq.answer}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                className="text-sm text-pink-700"
                onClick={() => toggleFaq(faq)}
              >
                {faq.isActive ? "Disable" : "Enable"}
              </button>
              <button
                className="text-sm text-red-600"
                onClick={() => deleteFaq(faq._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

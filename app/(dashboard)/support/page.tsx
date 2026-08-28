"use client";
import axios, { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { Loader2, LucideMailPlus } from "lucide-react";
import { useAuthStore } from "@/store/store";
import { useRouter } from "next/navigation";
import { TbEye } from "react-icons/tb";
import { IoMdClose } from "react-icons/io";
import { Mail, User, CalendarDays, MessageSquareText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Newsletter {
  _id: string;
  email: string;
  createdAt: string;
}

interface ContactQuery {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

const AnalysisPage = () => {
  const { user } = useAuthStore();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [newslettersLoading, setNewslettersLoading] = useState(false);
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [queriesLoading, setQueriesLoading] = useState(false);
  const router = useRouter();
  const [sidebar, setSidebar] = useState(false);
  const [query, setQuery] = useState<number | null>(null);
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const handleReply = async () => {
    console.log(query);
    console.log(response);

    if (query === null || !queries[query]) return;
    if (!response.trim()) {
      setQueryError("Please enter a response.");
      return;
    }

    setLoading(true);
    try {
      setQueryError(null);
      const mailResponse = await axios.post("/api/response", {
        email: queries[query!].email,
        name: queries[query!].name,
        response: response.trim(),
      });
      console.log(mailResponse?.data?.message);
      setResponse("");
      setSidebar(false);
    } catch (error) {
      console.log(error);
      setQueryError("Error sending response.");
    } finally {
      setLoading(false);
    }
  };

  const closeSidebar = () => {
    setSidebar(false);
    setQuery(null);
    setResponse("");
    setQueryError(null);
  };

  const fetchQueries = async () => {
    setQueriesLoading(true);
    try {
      const response = await axios.get("/api/contact", {
        params: { page: 1, limit: 100 },
      });
      setQueries(response.data.contacts || []);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data);
      } else {
        console.log(error);
      }
    } finally {
      setQueriesLoading(false);
    }
  };

  const fetchNewsletter = async () => {
    setNewslettersLoading(true);
    try {
      const response = await axios.get("/api/newsletter", {
        params: { page: 1, limit: 100 },
      });
      setNewsletters(response.data.newsletters || []);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data);
      } else {
        console.log(error);
      }
    } finally {
      setNewslettersLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsletter();
    fetchQueries();
    if (!user) {
      router.push("/login");
    }
  }, []);

  return (
    <div className="mt-2 overflow-y-scroll max-h-[90vh] pt-20 pb-20 md:pt-0 md:mb-0 md:px-4">
      <h1 className="text-2xl font-bold text-pink-700 mb-4">
        Analysis Dashboard
      </h1>

      {/* Newsletter Section */}
      <div>
        <h2 className="md:text-xl font-semibold text-gray-600 mb-3">
          📬 Newsletter Subscriptions
        </h2>
        {newslettersLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="animate-spin w-6 h-6 text-pink-500" />
          </div>
        ) : newsletters.length === 0 ? (
          <p className="text-gray-500">No newsletter subscriptions yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100 text-sm font-semibold text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-600">
                {newsletters.map((item) => (
                  <tr key={item._id} className="border-t">
                    <td className="px-4 py-3">{item.email}</td>
                    <td className="px-4 py-3">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contact Queries Section */}
      <div className="my-6">
        <h2 className="md:text-xl font-semibold text-gray-600 mb-3">
          💬 Contact Queries
        </h2>
        {queriesLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="animate-spin w-6 h-6 text-pink-500" />
          </div>
        ) : queries.length === 0 ? (
          <p className="text-gray-500">No contact queries yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100 text-sm font-semibold text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Message</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-600">
                {queries.map((item, index) => (
                  <tr key={item._id} className="border-t">
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.email}</td>
                    <td
                      className="px-4 py-3 max-w-sm truncate"
                      title={item.message}
                    >
                      {item.message}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 flex items-center justify-center">
                      <TbEye
                        className="hover:text-gray-400 cursor-pointer size-6"
                        onClick={() => {
                          setSidebar(true);
                          setQuery(index);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        className={`fixed inset-0 z-50 bg-black/70 transition-opacity duration-300  ${
          sidebar ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => closeSidebar()}
      >
        <div
          className={`fixed right-0 top-18 md:top-0 h-full w-full sm:w-96 bg-white p-6 shadow-2xl transform transition-transform duration-300 ${
            sidebar ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-pink-700">Contact Query</h2>
            <button
              className="text-gray-600 p-1 hover:text-black bg-gray-200 cursor-pointer rounded-full hover:scale-90 hover:rotate-90 transition-transform duration-300"
              onClick={() => closeSidebar()}
            >
              <IoMdClose size={24} />
            </button>
          </div>

          {/* Query Details */}
          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <User className="text-pink-600" size={20} />
              <span className="font-medium">Name:</span>
              <span>{queries[query!]?.name}</span>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="text-pink-600" size={20} />
              <span className="font-medium">Email:</span>
              <span>{queries[query!]?.email}</span>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays className="text-pink-600" size={20} />
              <span className="font-medium">Date:</span>
              <span>
                {new Date(queries[query!]?.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="">
              <div className="flex items-center gap-2">
                <MessageSquareText className="text-pink-600" size={20} />
                <span className="font-medium">Message:</span>
              </div>
              <p className="mt-2">{queries[query!]?.message}</p>
            </div>

            <div>
              <h1 className="my-2 font-bold flex items-center gap-2">
                {" "}
                <LucideMailPlus className="size-5 text-pink-700" />
                Your Reply
              </h1>
              <Textarea
                placeholder="Enter your response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
              <Button
                className="mt-2 cursor-pointer bg-pink-600 text-white hover:bg-pink-700/60"
                onClick={handleReply}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reply"}
              </Button>
              {queryError && <p className="text-red-500 mt-2">{queryError}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;

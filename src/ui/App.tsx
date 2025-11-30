import { ChatInterface } from "./components/ChatInterface";

export default function App() {
  return (
    <div className="min-h-screen bg-linear-to-br from-pink-100 via-blue-100 to-purple-100 flex items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-linear-to-br from-pink-300 to-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-blue-300 to-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-linear-to-br from-purple-300 to-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-linear-to-br from-green-300 to-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-6000" />

      <ChatInterface />
    </div>
  );
}

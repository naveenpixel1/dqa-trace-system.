import LogForm from './components/LogForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">DQA-Trace System</h1>
          <p className="text-slate-400 mt-2 text-sm">Digital Quality Assurance for Smart Micro & Small Enterprises</p>
        </header>
        
        <LogForm />
      </div>
    </main>
  );
}

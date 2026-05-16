export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-6 sm:gap-x-6 sm:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="hidden sm:flex sm:items-center sm:gap-4">
            <div className="text-sm font-medium text-slate-900">Sarah (Admin)</div>
            <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-medium">
              SA
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

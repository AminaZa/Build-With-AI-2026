export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#2A2D3A] bg-[#1A1D27] px-6 sm:gap-x-6 sm:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="hidden sm:flex sm:items-center sm:gap-4">
            <div className="text-sm font-medium text-[#E8E9ED]">John (Admin)</div>
            <div className="h-9 w-9 rounded-full bg-[#232733] flex items-center justify-center text-[#8B8D98] font-medium text-sm border border-[#2A2D3A]">
              JA
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

import fs from 'fs';

// 1. Fix admin-settings-client.tsx
let content = fs.readFileSync('src/components/admin/admin-settings-client.tsx', 'utf8');

// replace cards
content = content.replace(/className="bg-gradient-to-br from-card\/95 to-card\/80 backdrop-blur-xl border border-border\/60 rounded-2xl overflow-hidden shadow-2xl shadow-[^"]+"/g, 'className="group relative overflow-hidden rounded-3xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] shadow-2xl transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]"');
content = content.replace(/className="bg-card\/60 backdrop-blur-xl border-border rounded-3xl overflow-hidden shadow-xl"/g, 'className="group relative overflow-hidden rounded-3xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] shadow-2xl transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]"');

// header backgrounds
content = content.replace(/className="border-b border-border\/[0-9]+ bg-gradient-to-r [^"]*"/g, 'className="border-b border-white/[0.03] bg-white/[0.02] p-6"');
content = content.replace(/className="border-b border-border\/[a-z]+ bg-gradient-to-r [^"]*"/g, 'className="border-b border-white/[0.03] bg-white/[0.02] p-6"');

// inner panels
content = content.replace(/bg-gradient-to-r from-[a-z]+-[0-9]+\/50 to-[a-z]+-[0-9]+\/50 dark:from-[^ ]+ dark:to-[^ ]+ rounded-xl border border-[^ ]+ dark:border-[^"]+/g, 'bg-white/[0.02] rounded-2xl border border-white/[0.05] p-4 text-white');
content = content.replace(/bg-gray-50 dark:bg-gray-900 rounded-lg/g, 'bg-white/[0.02] rounded-2xl border border-white/[0.05] p-4');
content = content.replace(/bg-[a-z]+-50 dark:bg-[a-z]+-900\/20 rounded-lg border border-[a-z]+-200 dark:border-[a-z]+-800/g, 'bg-white/[0.02] rounded-2xl border border-white/[0.05]');

// label and text
content = content.replace(/text-gray-900 dark:text-white/g, 'text-white font-medium');
content = content.replace(/text-gray-700 dark:text-gray-300/g, 'text-white/80 text-sm');
content = content.replace(/text-gray-500 dark:text-gray-400/g, 'text-muted-foreground text-xs');
content = content.replace(/text-gray-600 dark:text-gray-300/g, 'text-white/70 text-sm');
content = content.replace(/text-gray-500/g, 'text-muted-foreground');
content = content.replace(/text-foreground/g, 'text-white');

// label styles
content = content.replace(/className="text-sm font-semibold text-foreground/g, 'className="text-sm font-medium text-white/90');
content = content.replace(/text-lg font-semibold text-white/g, 'text-lg font-bold text-white mb-2');

// Input styles
content = content.replace(/className="bg-background\/50 border-border\/50 focus:border-[^/]+\/50 focus:ring-[^"]+"/g, 'className="h-11 bg-white/5 border-white/10 text-white focus:bg-white/10 transition-all rounded-xl mt-1.5"');
content = content.replace(/className="max-w-xl"/g, 'className="max-w-xl h-11 bg-white/5 border-white/10 text-white focus:bg-white/10 transition-all rounded-xl"');

// code blocks inside settings
content = content.replace(/bg-white dark:bg-black\/40 p-2 rounded border/g, 'bg-black/50 p-3 rounded-xl border border-white/10');

// save buttons
content = content.replace(/className={`rounded-xl h-12 bg-gradient-to-r \${gradient} ([^`]+)`}/g, 'className={`rounded-xl h-12 bg-white text-black hover:bg-neutral-200 shadow-lg transition-all disabled:opacity-50 w-full md:w-auto px-8 font-medium`}');

fs.writeFileSync('src/components/admin/admin-settings-client.tsx', content);

// 2. Fix admin-hosting-client.tsx
let hosting = fs.readFileSync('src/components/admin/admin-hosting-client.tsx', 'utf8');

// modernize controls
hosting = hosting.replace(/rounded-2xl border border-white\/10 bg-white\/\[0\.02\] p-4 space-y-4/g, 'group relative overflow-hidden rounded-3xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-7 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08] space-y-6');

// make selects nicer (must be careful to not break existing classes)
hosting = hosting.replace(/className="mt-1 h-10 w-full rounded-md border border-white\/10 bg-black\/30 px-3 text-sm"/g, 'className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"');

// make inputs nicer
hosting = hosting.replace(/className="mt-1 h-10"/g, 'className="mt-1.5 h-11 bg-white/5 border-white/10 text-white focus:bg-white/10 transition-all rounded-xl"');
hosting = hosting.replace(/className="mt-1 h-10 w-full /g, 'className="mt-1.5 h-11 w-full ');
hosting = hosting.replace(/className="h-10"/g, 'className="h-11 rounded-xl"');

// Add nice ChevronRight to select wrappers without breaking existing HTML
// We will do another replace for select Wrappers
hosting = hosting.replaceAll('<select', '<div className="relative"><select');
hosting = hosting.replaceAll('</select>', '</select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/50"><ChevronRight className="h-4 w-4 rotate-90" /></div></div>');

fs.writeFileSync('src/components/admin/admin-hosting-client.tsx', hosting);
console.log('Successfully updated AdminSettingsClient and AdminHostingClient UI!');

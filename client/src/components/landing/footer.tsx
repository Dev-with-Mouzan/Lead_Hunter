const footerLinks = {
  Product: [
    { label: 'Google Places Search', href: '#modes' },
    { label: 'Web Search', href: '#modes' },
    { label: 'CSV Export', href: '#features' },
    { label: 'vCard Export', href: '#features' },
  ],
  Resources: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Search Leads', href: '/search' },
    { label: 'History', href: '/history' },
  ],
}

export function Footer() {
  return (
    <footer className="relative border-t border-border/50 bg-card/30 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-1.5">
              <img src="/logo.png" alt="LeadHunter" className="h-10 w-auto shrink-0" />
              <span className="font-heading font-bold text-xl tracking-tight text-white">
                LeadHunter
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mt-4">
              Lead intelligence platform for finding businesses, extracting contact information,
              and generating leads for your sales team.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-white transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} LeadHunter. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Lead Intelligence Platform
          </p>
        </div>
      </div>
    </footer>
  )
}

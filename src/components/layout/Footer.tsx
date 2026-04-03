import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-foreground text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold">AgentHub</span>
            </div>
            <p className="text-gray-400 text-sm">
              The global marketplace for AI agents. Connect with top AI developers and automate your business.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Marketplace</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/browse" className="hover:text-white transition-colors">Browse Agents</Link></li>
              <li><Link href="/browse?category=customer-support" className="hover:text-white transition-colors">Customer Support</Link></li>
              <li><Link href="/browse?category=data-analysis" className="hover:text-white transition-colors">Data Analysis</Link></li>
              <li><Link href="/browse?category=code-dev" className="hover:text-white transition-colors">Code & Dev</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">For Sellers</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/dashboard/create-listing" className="hover:text-white transition-colors">List Your Agent</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Seller Dashboard</Link></li>
              <li><Link href="/dashboard/orders" className="hover:text-white transition-colors">Manage Orders</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} AgentHub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

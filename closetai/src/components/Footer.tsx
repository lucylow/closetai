import { KiloBadge } from "@/components/sponsors";

const Footer = () => {
  return (
    <footer className="container border-t border-primary/10 py-10 space-y-8">
      <div className="flex justify-center">
        <KiloBadge />
      </div>
      <div className="text-center space-y-4">
        <p className="text-muted-foreground text-sm">ClosetAI – built for DeveloperWeek 2026 Hackathon</p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <a href="https://perfectcorp.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Perfect Corp</a>
          <a href="https://you.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">You.com</a>
          <a href="https://linode.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Akamai (Linode)</a>
          <a href="https://kilo.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Kilo.ai</a>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 ClosetAI. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

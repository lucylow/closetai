const Footer = () => {
  return (
    <footer className="container border-t border-primary/10 py-10 text-center space-y-4">
      <p className="text-muted-foreground text-sm">ClosetAI – built for DeveloperWeek 2026 Hackathon</p>
      <div className="flex flex-wrap justify-center gap-4 text-sm">
        {["GitHub", "Devpost", "Perfect Corp", "You.com", "Akamai"].map(link => (
          <a key={link} href="#" className="text-primary hover:underline">{link}</a>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">© 2026 ClosetAI. All rights reserved.</p>
    </footer>
  );
};

export default Footer;

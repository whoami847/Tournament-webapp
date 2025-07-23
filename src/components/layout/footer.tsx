export default function Footer() {
  return (
    <footer className="border-t hidden md:block">
      <div className="container flex items-center justify-center py-4">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Esports HQ. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

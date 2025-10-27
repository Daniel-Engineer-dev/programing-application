import React from "react";
import Link from "next/link";
type NavbarProps = {};
const NavBar: React.FC<NavbarProps> = () => {
  return (
    <div className="flex items-center justify-between sm:px-12 px-2 md:px-24">
      <Link href="/" className="flex items-center justify-center h-20">
        <img src="/logo.png" alt="LeetCline" className="h-full" />
      </Link>
      <div className="flex items-center">
        <button
          className="bg-amber-400 text-white px-2 py-1 rounded-md text-sm font-medium 
        hover:text-orange-400 hover:bg-white hover:border-2 hover:border-orange-400 border-2 border-transparent hover:cursor-pointer
        transtion duration-300 ease-in-out
        "
        >
          Sign In
        </button>
      </div>
    </div>
  );
};

export default NavBar;

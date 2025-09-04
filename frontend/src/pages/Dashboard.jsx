import React from 'react'
import Logo from "../assets/logo.png"
import { NavLink, Outlet } from 'react-router-dom'
import { FaLink, FaRegUserCircle } from "react-icons/fa";
import { IoEyeOutline } from "react-icons/io5";
import { RxExit } from "react-icons/rx";

export const Dashboard = () => {
  return (
    <div>
      <nav>
        <ul className='flex flex-row justify-between items-center p-5'>
          <li className='flex items-center gap-3'>
            <img src={Logo} alt="Lync logo" className="w-12 h-12 object-contain" />
            <span className="text-xl font-semibold">Lync</span>
          </li>

          <li className='flex flex-row gap-10'>
            <li>
              <NavLink 
                to="links"
                className={({ isActive }) => 'flex flex-row items-center gap-3'}>
                <FaLink />
                Link
              </NavLink>
            </li>
            <li className='flex flex-row'>
              <NavLink 
                to="profile"
                className={({ isActive }) => 'flex flex-row items-center gap-3'}>
                <FaRegUserCircle  />
                Profile Details
              </NavLink>
            </li>
          </li>

          <li className='flex flex-row gap-5'>
            <li>
              <IoEyeOutline />
            </li>
            <li>
              <RxExit />
            </li>
          </li>
        </ul>
      </nav>

      <main className="flex flex-row flex-1 p-5 gap-50 bg-gray-50 ">
        <div className="border w-[350px] h-[]">
           
        </div>
        <div className="">
          <Outlet />
        </div>
      </main>

    </div>
  )
}

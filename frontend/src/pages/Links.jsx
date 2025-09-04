import React from 'react'
import { Link } from 'react-router-dom'

export const Links = () => {
  return (
    <div>
        <div className="bg-white p-5">
            <h1 className='text-xl font-bold mb-5'>Customize your links</h1>
            <h3 className='text-gray-400 mb-5'>Add/edit/remove below and then share all your profile with the worlds!</h3>
            <div className="">
                <Link className=' border border-2 rounded text-blue-600 border-blue-600 flex flex-row items-center bg-white  px-60 py-2'>
                    <span>+</span>
                    <h2>Add New Link</h2>
                </Link>
            </div>
        </div>
    </div>
  )
}

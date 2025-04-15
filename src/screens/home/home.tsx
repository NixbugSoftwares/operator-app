import React from 'react'
import { useNavigate } from 'react-router-dom'
import localStorageHelper from '../../utils/localStorageHelper';
function home() {
  const userData = localStorageHelper.getItem("@user")
  console.log(userData);
  
  const navigate = useNavigate()
  const handleButtonClick = () => {
    navigate("/about")
  }
  return (
    <>
      <div>home</div>

      <button onClick={handleButtonClick}> About</button>
    </>
  )
}

export default home
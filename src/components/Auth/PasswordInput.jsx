import "./PasswordInput.css";

import { useState } from "react";

import {
    FaLock,
    FaEye,
    FaEyeSlash
} from "react-icons/fa";

export default function PasswordInput({

    value,
    onChange,
    name,
    placeholder

}){

    const [showPassword,setShowPassword]=useState(false);

    return(

        <div className="passwordGroup">

            <label>

                Password

            </label>

            <div className="passwordBox">

                <FaLock/>

                <input

                    type={
                        showPassword
                        ?
                        "text"
                        :
                        "password"
                    }

                    name={name}

                    value={value}

                    onChange={onChange}

                    placeholder={placeholder}

                    required

                />

                <button

                    type="button"

                    className="togglePassword"

                    onClick={()=>
                        setShowPassword(
                            !showPassword
                        )
                    }

                >

                    {

                        showPassword

                        ?

                        <FaEyeSlash/>

                        :

                        <FaEye/>

                    }

                </button>

            </div>

        </div>

    );

}
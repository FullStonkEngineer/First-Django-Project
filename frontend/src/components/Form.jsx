import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { useToast } from "../context/ToastContext";
import Loading from "./Loading";

const Form = ({ route, method }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const isLogin = method === "login";
  const label = isLogin ? "Sign in" : "Create account";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post(route, { username, password });
      if (isLogin) {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        navigate("/");
      } else {
        toast("Account created — please sign in.", "success");
        navigate("/login");
      }
    } catch (error) {
      const data = error.response?.data;
      const message =
        data?.detail ??
        Object.values(data ?? {})?.[0]?.[0] ??
        "Something went wrong. Please try again.";
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='auth-wrapper'>
      <form className='auth-form' onSubmit={handleSubmit} noValidate>
        <h1 className='auth-form__heading'>{label}</h1>

        <div className='auth-form__field'>
          <label className='auth-form__label' htmlFor='username'>
            Username
          </label>
          <input
            id='username'
            className='auth-form__input'
            type='text'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete={isLogin ? "username" : "new-username"}
            required
          />
        </div>

        <div className='auth-form__field'>
          <label className='auth-form__label' htmlFor='password'>
            Password
          </label>
          <input
            id='password'
            className='auth-form__input'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
          />
        </div>

        {loading && <Loading />}

        <button
          className='btn btn--primary btn--full'
          type='submit'
          disabled={loading}
        >
          {label}
        </button>

        <p className='auth-form__footer'>
          {isLogin ? (
            <>
              No account?{" "}
              <a className='auth-form__link' href='/register'>
                Register
              </a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a className='auth-form__link' href='/login'>
                Sign in
              </a>
            </>
          )}
        </p>
      </form>
    </div>
  );
};

export default Form;

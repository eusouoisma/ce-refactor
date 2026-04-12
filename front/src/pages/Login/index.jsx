import React, { useState, useContext, useCallback } from "react";
import { TextField, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import StoreContext from "../../components/Store/Context";

import { Main, Wrapper, Title, FormBox, Logo, PassWordWrapper } from "./login";
import LogoImg from "../../assets/logo-ce.png";

import Swal from "sweetalert2";
import { API_URL } from "../../utils/env";

const initialState = () => {
  return {
    username: "",
    password: "",
  };
};

const Login = () => {
  const [values, setValues] = useState(initialState);
  const { setToken, setUserPermissions } = useContext(StoreContext);
  let navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const onChange = (e) => {
    setValues({
      ...values,
      [e.target.name]: e.target.value,
    });
  };

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const body = {
        ...values,
      };

      await fetch(`${API_URL}users/login.php`, {
        method: "POST",
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.error) {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: response.error,
            });
          } else {
            setToken(response.token);
            setUserPermissions(parseInt(response.permissions));
            return navigate("/");
          }
        });

      setValues(initialState);
    },
    [values]
  );
  return (
    <Main>
      <Logo src={LogoImg} />
      <Wrapper>
        <Title>Login</Title>
        <FormBox
          component="form"
          noValidate
          autoComplete="off"
          onSubmit={onSubmit}
        >
          <TextField
            id="username"
            label="Username"
            variant="outlined"
            name="username"
            onChange={onChange}
            value={values.user}
          />
          <PassWordWrapper>
            <TextField
              id="filled-password-input"
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              variant="outlined"
              name="password"
              onChange={onChange}
              value={values.password}
            />
            {showPassword ? (
              <VisibilityIcon onClick={() => setShowPassword(false)} />
            ) : (
              <VisibilityOffIcon onClick={() => setShowPassword(true)} />
            )}
          </PassWordWrapper>
          <Button variant="outlined" type="submit">
            Login
          </Button>
        </FormBox>
      </Wrapper>
    </Main>
  );
};

export default Login;

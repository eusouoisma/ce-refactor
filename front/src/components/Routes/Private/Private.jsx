import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import StoreContext from "../../Store/Context";

const RoutesPrivate = ({ component: Component, permissions }) => {
  const { token, userPermissions } = useContext(StoreContext);

  if (!userPermissions) return;

  return token ? (
    !permissions || permissions.indexOf(userPermissions) !== -1 ? (
      <Component />
    ) : (
      <Navigate to="/" />
    )
  ) : (
    <Navigate to="/login" />
  );
};

export default RoutesPrivate;

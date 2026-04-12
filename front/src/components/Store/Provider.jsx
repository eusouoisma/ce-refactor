import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Context from "./Context";
import useStorage from "../../utils/useStorage";
import { API_URL } from "../../utils/env";

const StoreProvider = ({ children }) => {
  const [token, setToken] = useStorage("token");
  const [userPermissions, setUserPermissions] = useState("");
  const [userName, setUserName] = useState("");
  const [userUsername, setUserUsername] = useState("");
  const [currentYear, setCurrentYear] = useStorage("currentYear");
  const [sidebarClosed, setSidebarClosed] = useState(
    !!sessionStorage.getItem("sidebar-closed")
  );
  const [toursIsFiltered, setToursIsFiltered] = useState(false);
  const [selectedFiltersTours, setSelectedFiltersTours] = useState([]);
  const [filteredMonthsTours, setFilteredMonthsTours] = useState(
    localStorage.getItem("filteredMonthsTours")
      ? JSON.parse(localStorage.getItem("filteredMonthsTours"))
      : [null]
  );
  const [financialIsFiltered, setFinancialIsFiltered] = useState(false);
  const [selectedFiltersFinancial, setSelectedFiltersFinancial] = useState([]);
  const [filteredMonthsFinancial, setFilteredMonthsFinancial] = useState(
    localStorage.getItem("filteredMonthsFinancial")
      ? JSON.parse(localStorage.getItem("filteredMonthsFinancial"))
      : [null]
  );
  const [comissionsIsFiltered, setComissionsIsFiltered] = useState(false);
  const [selectedFiltersComissions, setSelectedFiltersComissions] = useState(
    []
  );
  const [filteredMonthsComissions, setFilteredMonthsComissions] = useState(
    localStorage.getItem("filteredMonthsComissions")
      ? JSON.parse(localStorage.getItem("filteredMonthsComissions"))
      : [null]
  );

  const [paymentsIsFiltered, setPaymentsIsFiltered] = useState(false);
  const [selectedFiltersPayments, setSelectedFiltersPayments] = useState([]);
  const [filteredMonthsPayments, setFilteredMonthsPayments] = useState(
    localStorage.getItem("filteredMonthsPayments")
      ? JSON.parse(localStorage.getItem("filteredMonthsPayments"))
      : [null]
  );

  const [resetProvider, setResetProvider] = useState(0);

  const navigate = useNavigate();

  const toggleSidebar = useCallback(() => {
    setSidebarClosed(!sidebarClosed);
    if (sidebarClosed) {
      sessionStorage.removeItem("sidebar-closed");
    } else {
      sessionStorage.setItem("sidebar-closed", "true");
    }
  }, [sidebarClosed]);

  useEffect(() => {
    fetch(`${API_URL}users/getUser.php?token=${token}`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.error) {
          setToken();
          navigate("/login");
        } else {
          setUserPermissions(parseInt(response.permissions));
          setUserName(response.name);
          setUserUsername(response.username);
        }
      });
  }, [token]);

  useEffect(() => {
    if (!currentYear) setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "filteredMonthsTours",
      JSON.stringify(filteredMonthsTours)
    );
  }, [filteredMonthsTours.length]);

  useEffect(() => {
    localStorage.setItem(
      "filteredMonthsFinancial",
      JSON.stringify(filteredMonthsFinancial)
    );
  }, [filteredMonthsFinancial.length]);

  useEffect(() => {
    localStorage.setItem(
      "filteredMonthsComissions",
      JSON.stringify(filteredMonthsComissions)
    );
  }, [filteredMonthsComissions.length, resetProvider]);

  useEffect(() => {
    localStorage.setItem(
      "filteredMonthsPayments",
      JSON.stringify(filteredMonthsPayments)
    );
  }, [filteredMonthsPayments.length, resetProvider]);

  return (
    <Context.Provider
      value={{
        token,
        setToken,
        sidebarClosed,
        setSidebarClosed,
        toggleSidebar,
        userPermissions,
        setUserPermissions,
        userName,
        userUsername,
        currentYear,
        setCurrentYear,
        toursIsFiltered,
        setToursIsFiltered,
        selectedFiltersTours,
        setSelectedFiltersTours,
        filteredMonthsTours,
        setFilteredMonthsTours,
        financialIsFiltered,
        setFinancialIsFiltered,
        selectedFiltersFinancial,
        setSelectedFiltersFinancial,
        filteredMonthsFinancial,
        setFilteredMonthsFinancial,
        comissionsIsFiltered,
        setComissionsIsFiltered,
        selectedFiltersComissions,
        setSelectedFiltersComissions,
        filteredMonthsComissions,
        setFilteredMonthsComissions,
        setResetProvider,
        paymentsIsFiltered,
        setPaymentsIsFiltered,
        selectedFiltersPayments,
        setSelectedFiltersPayments,
        filteredMonthsPayments,
        setFilteredMonthsPayments,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default StoreProvider;

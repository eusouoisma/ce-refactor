import React, { useState, useCallback, useEffect, useContext } from "react";
import Sidebar from "../../components/Sidebar";
import { forwardRef } from "react";
import { NumericFormat } from "react-number-format";

import {
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Autocomplete,
} from "@mui/material";

import Textarea from "@mui/joy/Textarea";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import StoreContext from "../../components/Store/Context";

import {
  Content,
  Main,
  SubTitle,
  Title,
  FormBox,
  FormRow,
  FormButtons,
} from "./financialtourinput";

import { useNavigate } from "react-router-dom";
import { API_URL } from "../../utils/env";

const getMonth = (date) => {
  var month = date.getMonth() + 1;
  return month < 10 ? "0" + month : "" + month;
};

const getDay = (date) => {
  var day = date.getDate();
  return day < 10 ? "0" + day : "" + day;
};

const curDate = new Date();
const formatedCurDate = `${curDate.getFullYear()}-${getMonth(curDate)}-${getDay(
  curDate
)}`;

const MoneyInput = forwardRef((props, ref) => {
  const { onChange, ...other } = props;
  return (
    <NumericFormat
      {...other}
      onValueChange={(values) => {
        onChange({
          target: { name: other.name, value: values.value },
        });
      }}
      getInputRef={ref}
      value={other.value}
      allowLeadingZeros={false}
      allowNegative={false}
      decimalScale={2}
      fixedDecimalScale={true}
      decimalSeparator=","
      allowedDecimalSeparators={["."]}
      thousandSeparator="."
      isAllowed={(values) => {
        if (values.value.length > 9) return false;
        return true;
      }}
    />
  );
});

const FinancialTourInput = () => {
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    type: "",
    company: "",
    invoiceNumber: "",
    status: "",
    paymentStatus: "",
    accountNumber: "",
    paymentDate: "",
    tourDate: "",
    tourHour: "",
    activity: "",
    adicional: "",
    isHighSeason: false,
    client: "",
    clientName: "",
    clientContact: "",
    orderRef: "",
    paymentMethod: "",
    currency: "R$",
    totalValue: "",
    netValue: "",
    financialComments: "",
    comissioned: false,
    conversationHistory: "",
  });
  const [formsStatus, setFormsStatus] = useState({});
  const [companies, setCompanies] = useState([]);
  const [activities, setActivities] = useState([]);
  const [adicionais, setAdicionais] = useState([]);
  const [selectedAdditional, setSelectedAdditional] = useState(null);
  const [status, setStatus] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState([]);
  const [accountNumbers, setAccountNumbers] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const { userName, userPermissions } = useContext(StoreContext);

  const onchange = useCallback(
    (e) => {
      if (e.target.type === "number" && e.target.value < 0) return;
      if (e.target.name === "adicional") {
        setSelectedAdditional(adicionais.find((a) => a.name === e.target.value) || null);
      }
      let newFormData = formData;
      if (e.target.type === "checkbox") {
        newFormData[e.target.name] = e.target.checked;
      } else {
        newFormData[e.target.name] = e.target.value;
      }
      setFormData(newFormData);
      setFormsStatus(Math.random());
    },
    [formData, activities, adicionais]
  );

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if ([5].indexOf(userPermissions) !== -1) return;

      let body = formData;
      body.createdBy = userName;
      body.lastEditBy = userName;

      fetch(`${API_URL}tours/create-financial.php`, {
        method: "POST",
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            MySwal.fire({
              title: <p>Sucesso</p>,
              html: <i>Tour cadastrado com sucesso</i>,
              icon: "success",
            }).then(() => {
              return e.nativeEvent.submitter.getAttribute("create-new")
                ? navigate(0)
                : navigate("/listar-tours-financeiro");
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Algo deu errado!",
            });
          }
        });
    },
    [formData, userName, userPermissions]
  );

  useEffect(() => {
    fetch(`${API_URL}products/list-all.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        let currentProductId = null;
        response.forEach((product) => {
          if (product.productId === currentProductId) {
            transformedData
              .find((p) => p.productId === currentProductId)
              .variants.push({
                pricingType: product.pricingType,
                priceAdult: product.priceAdult,
                priceHalf: product.priceHalf,
                priceNet: product.priceNet,
                priceFree: product.priceFree,
                priceGroup: product.priceGroup,
                paxLimit: product.paxLimit,
              });
          } else {
            transformedData.push({
              productId: product.productId,
              name: product.name,
              type: product.type,
              category: product.category,
              variants: [
                {
                  pricingType: product.pricingType,
                  priceAdult: product.priceAdult,
                  priceHalf: product.priceHalf,
                  priceNet: product.priceNet,
                  priceFree: product.priceFree,
                  priceGroup: product.priceGroup,
                  paxLimit: product.paxLimit,
                },
              ],
            });
            currentProductId = product.productId;
          }
        });
        setActivities(transformedData.filter((p) => p.category !== "adicional"));
        setAdicionais(transformedData.filter((p) => p.category === "adicional"));
      });

    fetch(`${API_URL}settings/status.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setStatus(transformedData);
      });
    fetch(`${API_URL}settings/currencies.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setCurrencies(transformedData);
      });
    fetch(`${API_URL}settings/payment-methods.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setPaymentMethods(transformedData);
      });

    fetch(`${API_URL}settings/payment-status.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setPaymentStatus(transformedData);
      });

    fetch(`${API_URL}settings/companies.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setCompanies(transformedData);
      });

    fetch(`${API_URL}settings/account-numbers.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setAccountNumbers(transformedData);
      });
  }, []);

  return (
    <Main>
      <Sidebar></Sidebar>
      <Content>
        <SubTitle>Tour</SubTitle>
        <Title>Registrar</Title>
        <FormBox
          component="form"
          noValidate
          autoComplete="off"
          onSubmit={onSubmit}
          status={formsStatus}
        >
          <FormRow>
            <FormControl fullWidth>
              <InputLabel id="tour-type-label">Tipo</InputLabel>
              <Select
                labelId="tour-type-label"
                id="tour-type"
                name="type"
                label="Tipo"
                value={formData.type}
                onChange={onchange}
              >
                <MenuItem value="regular">Regular</MenuItem>
                <MenuItem value="privativo">Privativo</MenuItem>
                <MenuItem value="show/evento">Show/Evento</MenuItem>
              </Select>
            </FormControl>
            <Autocomplete
              id="company"
              freeSolo
              options={companies.map((company) => company)}
              name="company"
              value={formData.company}
              onChange={(event, newValue) => {
                onchange({
                  target: { name: "company", value: newValue },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="company"
                  onChange={onchange}
                  label="Empresa"
                />
              )}
            />
          </FormRow>
          <FormRow>
            {" "}
            <TextField
              id="invoiceNumber"
              label="Nº da NF"
              variant="outlined"
              name="invoiceNumber"
              onChange={onchange}
              value={formData.invoiceNumber}
              type="number"
            />
            <Autocomplete
              id="status"
              freeSolo
              options={status.map((status) => status)}
              name="status"
              value={formData.status}
              onChange={(event, newValue) => {
                onchange({ target: { name: "status", value: newValue } });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="platform"
                  onChange={onchange}
                  label="Status Reserva"
                />
              )}
            />
          </FormRow>
          <FormRow>
            <Autocomplete
              id="paymentStatus"
              freeSolo
              options={paymentStatus.map((paymentStatus) => paymentStatus)}
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={(e, newValue) => {
                onchange({
                  target: { name: "paymentStatus", value: newValue },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="paymentStatus"
                  onChange={onchange}
                  label="Status de Pagamento"
                />
              )}
            />
            <Autocomplete
              id="accountNumber"
              freeSolo
              options={accountNumbers.map((accountNumber) => accountNumber)}
              name="accountNumber"
              value={formData.accountNumber}
              onChange={(event, newValue) => {
                onchange({
                  target: { name: "accountNumber", value: newValue },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="accountNumber"
                  onChange={onchange}
                  label="Número de Conta"
                />
              )}
            />
          </FormRow>
          <FormRow>
            <TextField
              id="paymentDate"
              label="Data de Pagamento"
              variant="outlined"
              name="paymentDate"
              onChange={onchange}
              value={formData.paymentDate}
              type="date"
            />
            <TextField
              id="tour-date"
              label="Data do tour"
              variant="outlined"
              name="tourDate"
              onChange={onchange}
              value={formData.tourDate}
              type="date"
              inputProps={{ min: formatedCurDate }}
            />
          </FormRow>
          <FormRow>
            <TextField
              id="tour-Hour"
              label="Hora do Tour"
              variant="outlined"
              name="tourHour"
              onChange={onchange}
              value={formData.tourHour}
              type="time"
            />
            <Autocomplete
              id="activity"
              freeSolo
              options={activities
                .filter((activity) => activity.type === formData.type)
                .map((activity) => activity.name)}
              name="activity"
              value={formData.activity}
              onChange={(e, newValue) => {
                onchange({
                  target: { name: "activity", value: newValue },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="activity"
                  onChange={onchange}
                  label="Atividade"
                />
              )}
            />
            <Autocomplete
              id="adicional"
              freeSolo
              options={adicionais.map((a) => a.name)}
              name="adicional"
              value={formData.adicional}
              onChange={(e, newValue) => {
                onchange({
                  target: { name: "adicional", value: newValue || "" },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="adicional"
                  onChange={onchange}
                  label="Adicional"
                />
              )}
            />
          </FormRow>
          <FormRow>
            {" "}
            <TextField
              id="client"
              label="Cliente"
              variant="outlined"
              name="client"
              onChange={onchange}
              value={formData.client}
            />
            <TextField
              id="order-ref"
              label="Nº da Reserva"
              variant="outlined"
              name="orderRef"
              onChange={onchange}
              value={formData.orderRef}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isHighSeason}
                  onChange={onchange}
                  name="isHighSeason"
                />
              }
              label="Alta Temporada"
            />
          </FormRow>
          <FormRow>
            {" "}
            <Autocomplete
              id="paymentMethod"
              freeSolo
              options={paymentMethods.map((paymentMethod) => paymentMethod)}
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={(event, newValue) => {
                onchange({
                  target: { name: "paymentMethod", value: newValue },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="paymentMethod"
                  onChange={onchange}
                  label="Método de Pagamento"
                />
              )}
            />
            <Autocomplete
              id="currency"
              freeSolo
              options={currencies.map((currency) => currency)}
              name="currency"
              value={formData.currency}
              onChange={(event, newValue) => {
                onchange({ target: { name: "currency", value: newValue } });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="currency"
                  onChange={onchange}
                  label="Moeda"
                />
              )}
            />
          </FormRow>
          <FormRow>
            <TextField
              id="totalValue"
              label="Valor Total"
              variant="outlined"
              name="totalValue"
              onChange={onchange}
              value={formData.totalValue}
              InputProps={{
                inputComponent: MoneyInput,
              }}
              inputProps={{
                prefix: `${formData.currency} `,
              }}
            />
            <TextField
              id="netValue"
              label="Valor NET"
              variant="outlined"
              name="netValue"
              onChange={onchange}
              value={formData.netValue}
              InputProps={{
                inputComponent: MoneyInput,
              }}
              inputProps={{
                prefix: `${formData.currency} `,
              }}
            />
          </FormRow>
          <FormRow>
            <TextField
              id="clientName"
              label="Nome do Cliente"
              variant="outlined"
              name="clientName"
              onChange={onchange}
              value={formData.clientName}
            />
            <TextField
              id="clientContact"
              label="Contato do Cliente"
              variant="outlined"
              name="clientContact"
              onChange={onchange}
              value={formData.clientContact}
            />
          </FormRow>
          <FormRow>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    id="comissioned"
                    name="commissioned"
                    onChange={onchange}
                    checked={formData.comissioned}
                  />
                }
                label="Comissionado"
              />
            </FormGroup>
            <Textarea
              minRows={4}
              placeholder="Observações"
              id="financialComments"
              name="financialComments"
              onChange={onchange}
              value={formData.financialComments}
            />
            <Textarea
              minRows={4}
              placeholder="Histórico da Conversa"
              id="conversationHistory"
              name="conversationHistory"
              onChange={onchange}
              value={formData.conversationHistory}
            />
          </FormRow>
          <FormButtons>
            <Button variant="outlined" type="submit">
              Salvar
            </Button>
            <Button variant="outlined" type="submit" create-new="true">
              Salvar e Criar Outra
            </Button>
          </FormButtons>
        </FormBox>
      </Content>
    </Main>
  );
};

export default FinancialTourInput;

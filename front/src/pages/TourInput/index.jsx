import React, { useState, useCallback, useEffect, useContext } from "react";
import Sidebar from "../../components/Sidebar";
import { forwardRef } from "react";

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
  ListItemText,
  Chip,
} from "@mui/material";

import { NumericFormat } from "react-number-format";

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
  ComissionModal,
  ComissionModalHeader,
  ComissionModalTitle,
  ComissionModalClose,
} from "./tourinput";

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
      onValueChange={(values, sourceInfo) => {
        onChange({
          target: {
            name: other.name,
            value: values.value,
            manuellement: !!sourceInfo.event,
          },
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

const TourInput = () => {
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();

  const { userName, userPermissions } = useContext(StoreContext);

  const [formData, setFormData] = useState({
    type: "regular",
    orderRef: "",
    platform: "",
    tourDate: "",
    tourHour: "",
    duration: "",
    activity: "",
    local: "",
    language: "",
    client: "",
    status: "",
    paymentStatus: "",
    paxAdult: 0,
    paxHalf: 0,
    paxFree: 0,
    paxNet: 0,
    paxBrazilian: 0,
    currency: "R$",
    paymentMethod: "",
    totalValue: 0.0,
    numberOfGroups: 0,
    ceGuide: [],
    clientName: "",
    clientContact: "",
    country: [],
    emailSubject: "",
    companionName: "",
    companionContact: "",
    commissioned: false,
    comments: "",
    dateOfRegistration: formatedCurDate,
    comissionersName: "",
    comissionersContact: "",
    comissionCurrency: "",
    comissionPrice: "",
    comissionPaid: false,
    comissionByPercentage: false,
    comissionPercentage: 0,
    isHighSeason: false,
    conversationHistory: "",
    adicional: "",
  });
  const [formsStatus, setFormsStatus] = useState({});

  const [platforms, setPlatforms] = useState([]);
  const [activities, setActivities] = useState([]);
  const [adicionais, setAdicionais] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [status, setStatus] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState([]);
  const [locals, setLocals] = useState([]);
  const [guides, setGuides] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerContactsOptions, setCustomerContactsOptions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedAdditional, setSelectedAdditional] = useState(null);
  const [blockUpdateTotalValue, setBlockUpdateTotalValue] = useState(false);
  const [blockUpdateNumberOfGroups, setBlockUpdateNumberOfGroups] =
    useState(false);
  const [comissionModalOpened, setComissionModalOpened] = useState(false);

  const [paxEntries, setPaxEntries] = useState([{ type: '', quantity: 0 }]);

  const handlePaxTypeChange = (index, type) => {
    const newEntries = [...paxEntries];
    newEntries[index].type = type;
    setPaxEntries(newEntries);
    
    // Reset all pax values
    setFormData(prev => ({
      ...prev,
      paxAdult: 0,
      paxHalf: 0,
      paxFree: 0,
      paxNet: 0
    }));
    
    // Update the selected type
    newEntries.forEach(entry => {
      if (entry.type && entry.quantity > 0) {
        setFormData(prev => ({
          ...prev,
          [entry.type]: entry.quantity
        }));
      }
    });
  };

  const handlePaxQuantityChange = (index, quantity) => {
    const newEntries = [...paxEntries];
    newEntries[index].quantity = parseInt(quantity) || 0;
    
    // Se a quantidade for maior que 0 e for a última linha, adiciona uma nova linha
    if (parseInt(quantity) > 0 && index === paxEntries.length - 1) {
      newEntries.push({ type: '', quantity: 0 });
    }
    
    setPaxEntries(newEntries);
    
    // Reset all pax values
    setFormData(prev => ({
      ...prev,
      paxAdult: 0,
      paxHalf: 0,
      paxFree: 0,
      paxNet: 0
    }));
    
    // Update the selected type
    newEntries.forEach(entry => {
      if (entry.type && entry.quantity > 0) {
        setFormData(prev => ({
          ...prev,
          [entry.type]: entry.quantity
        }));
      }
    });
  };

  const onchange = useCallback(
    (e) => {
      if (e.target.name === "ceGuide") {
      }
      if (e.target.type === "number" && e.target.value < 0) return;
      let newFormData = formData;
      
      // Tratar o campo country como array
      if (e.target.name === "country") {
        newFormData[e.target.name] = Array.isArray(e.target.value) ? e.target.value : [];
      } else {
        newFormData[e.target.name] =
          e.target.type === "checkbox" ? e.target.checked : e.target.value;
      }
      if (e.target.name === "activity") {
        setSelectedProduct(activities.find((a) => a.name === e.target.value));
        newFormData.duration = activities.find(
          (a) => a.name === e.target.value
        )?.duration;
      }
      if (e.target.name === "adicional") {
        setSelectedAdditional(adicionais.find((a) => a.name === e.target.value) || null);
      }
      if (e.target.name === "totalValue" && e.target.manuellement)
        setBlockUpdateTotalValue(true);
      if (e.target.name === "numberOfGroups")
        setBlockUpdateNumberOfGroups(true);
      if (e.target.name === "client") changeCustomersContactsOptions();
      if (e.target.name === "type") {
        newFormData.totalValue = 0;
        newFormData.activity = "";
        newFormData.duration = "";
        newFormData.paxAdult = 0;
        newFormData.paxFree = 0;
        newFormData.paxHalf = 0;
        newFormData.paxNet = 0;
        setSelectedProduct(null);
      }
      if (e.target.name === "commissioned" && e.target.checked)
        setComissionModalOpened(true);
      if (e.target.name === "clientName") {
        if (typeof e.target.value === "object") {
          newFormData.clientName = e.target.value ? e.target.value.label : "";
          newFormData.clientContact = e.target.value
            ? e.target.value.contact
            : "";
        } else {
          newFormData.clientName = e.target.value;
        }
      }
      if (e.target.name === "numberOfGroups") updateNumberOfGroups(true);
      if (e.target.name === "paxAdult") updateNumberOfGroups();
      changeComissionPrice();
      setFormData(newFormData);
      setFormsStatus(Math.random());

    },
    [formData, activities, customers]
  );

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if ([5].indexOf(userPermissions) !== -1) return;

      let body = { ...formData };
      // Converter array de países para string concatenada
      if (Array.isArray(body.country)) {
        body.country = body.country.join(", ");
      }
      body.createdBy = userName;
      body.lastEditBy = userName;

      let client = body.client;

      if (
        client !== "" &&
        !customers.find((customer) => customer.name === client)
      ) {
        const {
          value: clientType,
          isConfirmed,
          isDismissed,
        } = await MySwal.fire({
          title: `O cliente ${client} é novo. Qual o tipo do cliente?`,
          input: "select",
          inputOptions: {
            Agencia: "Agência",
            Guia: "Guia",
            ClienteFinal: "Cliente Final",
          },
          inputPlaceholder: "Selecione um tipo",
          showCancelButton: true,
          confirmButtonText: "Enviar",
          cancelButtonText: "Cancelar",
          inputValidator: (value) => {
            return new Promise((resolve) => {
              if (value) {
                resolve();
              } else {
                resolve("Você precisa selecionar um tipo de cliente");
              }
            });
          },
        });

        if (isConfirmed) {
          body.newCustomerType = clientType;
        } else if (isDismissed) {
          return;
        }
      }

      fetch(`${API_URL}tours/create.php`, {
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
                : navigate("/listar-tours");
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
    [formData, userName, customers, userPermissions]
  );

  const changeComissionPrice = useCallback(
    (e) => {
      if (formData.comissionByPercentage) {
        const price = (
          0.01 *
          formData.comissionPercentage *
          parseFloat(formData.totalValue)
        ).toFixed(2);
        let newFormData = formData;
        newFormData.comissionPrice = price;
        setFormData(newFormData);
        setFormsStatus(Math.random());
      }
    },
    [formsStatus, formData]
  );

  const changeCustomersContactsOptions = useCallback(() => {
    let filteredCustomersContacts = customers.filter(
      (contact) => contact.name === formData.client
    );
    let contacts = [];
    filteredCustomersContacts.forEach((customer) =>
      contacts.push(...customer.contacts)
    );
    contacts = contacts.filter((contact) => contact.contactName !== "");
    setCustomerContactsOptions(contacts);
    setFormsStatus(Math.random());
  }, [customers, formData]);

  const updateNumberOfGroups = useCallback(() => {
    if (!blockUpdateNumberOfGroups && formData.type === "privativo") {
      let numberOfGroups = Math.ceil(formData.paxAdult / 30);
      let newForData = formData;
      newForData.numberOfGroups = numberOfGroups;
      setFormData(newForData);
      setFormsStatus(Math.random());
    }
  }, [formsStatus, formData, blockUpdateNumberOfGroups]);

  useEffect(() => {
    fetch(`${API_URL}settings/platforms.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setPlatforms(transformedData);
      });
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
                priceBrazilian: product.priceBrazilian,
                priceFree: product.priceFree,
                priceGroup: product.priceGroup,
                priceAdultHighSeason: product.priceAdultHighSeason,
                priceHalfHighSeason: product.priceHalfHighSeason,
                priceNetHighSeason: product.priceNetHighSeason,
                priceBrazilianHighSeason: product.priceBrazilianHighSeason,
                priceGroupHighSeason: product.priceGroupHighSeason,
                paxLimit: product.paxLimit,
              });
          } else {
            transformedData.push({
              productId: product.productId,
              name: product.name,
              type: product.type,
              category: product.category || "atividade",
              duration: product.duration,
              variants: [
                {
                  pricingType: product.pricingType,
                  priceAdult: product.priceAdult,
                  priceHalf: product.priceHalf,
                  priceNet: product.priceNet,
                  priceBrazilian: product.priceBrazilian,
                  priceFree: product.priceFree,
                  priceGroup: product.priceGroup,
                  priceAdultHighSeason: product.priceAdultHighSeason,
                  priceHalfHighSeason: product.priceHalfHighSeason,
                  priceNetHighSeason: product.priceNetHighSeason,
                  priceBrazilianHighSeason: product.priceBrazilianHighSeason,
                  priceGroupHighSeason: product.priceGroupHighSeason,
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
    fetch(`${API_URL}settings/languages.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setLanguages(transformedData);
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

    fetch(`${API_URL}settings/locals.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setLocals(transformedData);
      });

    fetch(`${API_URL}settings/guides.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setGuides(transformedData);
      });

    fetch(`${API_URL}customers/list-grouped.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((item) => transformedData.push(item));
        setCustomers(transformedData);
      });

    fetch(`${API_URL}settings/countries.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setCountries(transformedData);
      });
  }, []);

  useEffect(() => {
    if (!selectedProduct || blockUpdateTotalValue) return;
    let paxTotal =
      formData.type === "regular"
        ? parseInt(formData.paxAdult) +
          parseInt(formData.paxHalf) +
          parseInt(formData.paxNet) +
          parseInt(formData.paxBrazilian)
        : parseInt(formData.paxAdult);

    const calcVariantValue = (product, paxTotal) => {
      let selectedVariant = null;
      if (product.type === "show/evento") {
        selectedVariant = product.variants[0];
      } else {
        const sorted = [...product.variants].sort((a, b) => a.paxLimit - b.paxLimit);
        for (let i = 0; i < sorted.length; i++) {
          if (parseInt(sorted[i].paxLimit) > paxTotal) break;
          selectedVariant = sorted[i];
        }
      }
      if (!selectedVariant) return 0;
      if (selectedVariant.pricingType === "person") {
        if (formData.isHighSeason) {
          return (
            parseInt(formData.paxAdult) * (parseInt(selectedVariant.priceAdultHighSeason) || parseInt(selectedVariant.priceAdult)) +
            parseInt(formData.paxHalf) * (parseInt(selectedVariant.priceHalfHighSeason) || parseInt(selectedVariant.priceHalf)) +
            parseInt(formData.paxNet) * (parseInt(selectedVariant.priceNetHighSeason) || parseInt(selectedVariant.priceNet)) +
            parseInt(formData.paxBrazilian) * (parseInt(selectedVariant.priceBrazilianHighSeason) || parseInt(selectedVariant.priceBrazilian))
          );
        } else {
          return (
            parseInt(formData.paxAdult) * parseInt(selectedVariant.priceAdult) +
            parseInt(formData.paxHalf) * parseInt(selectedVariant.priceHalf) +
            parseInt(formData.paxNet) * parseInt(selectedVariant.priceNet) +
            parseInt(formData.paxBrazilian) * parseInt(selectedVariant.priceBrazilian)
          );
        }
      } else {
        if (formData.isHighSeason) {
          return parseInt(formData.numberOfGroups) * (parseInt(selectedVariant.priceGroupHighSeason) || parseInt(selectedVariant.priceGroup));
        } else {
          return parseInt(formData.numberOfGroups) * parseInt(selectedVariant.priceGroup);
        }
      }
    };

    let totalValue = calcVariantValue(selectedProduct, paxTotal);
    if (selectedAdditional) {
      totalValue += calcVariantValue(selectedAdditional, paxTotal);
    }

    let newFormData = formData;
    newFormData.totalValue = totalValue;
    setFormData(newFormData);
    setFormsStatus(Math.random());
  }, [selectedProduct, selectedAdditional, formData.paxAdult, formData.paxHalf, formData.paxNet, formData.paxBrazilian, formData.numberOfGroups, formData.isHighSeason, blockUpdateTotalValue]);

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
          {formData.type !== "" && (
            <>
              <FormRow>
                <Autocomplete
                  id="platform"
                  freeSolo
                  options={platforms.map((platform) => platform)}
                  name="platform"
                  value={formData.platform}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "platform", value: newValue } });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="platform"
                      onChange={onchange}
                      label="Plataforma"
                    />
                  )}
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
                <TextField
                  id="tour-Hour"
                  label="Hora do Tour"
                  variant="outlined"
                  name="tourHour"
                  onChange={onchange}
                  value={formData.tourHour}
                  type="time"
                />
              </FormRow>
              <FormRow>
                <div style={{ width: formData.platform === 'Email' ? '50%' : '100%' }}>
                  <Autocomplete
                    id="country"
                    multiple
                    options={countries}
                    name="country"
                    value={formData.country}
                    onChange={(event, newValue) => {
                      onchange({ target: { name: "country", value: newValue || [] } });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        name="country"
                        label="País"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          key={option}
                        />
                      ))
                    }
                  />
                </div>
                <div style={{ width: formData.platform === 'Email' ? '50%' : '100%', display: 'flex' }}>
                  <TextField
                    id="emailSubject"
                    label="Assunto do Email"
                    variant="outlined"
                    name="emailSubject"
                    onChange={onchange}
                    value={formData.emailSubject}
                    style={{ 
                      display: formData.platform === "Email" ? "flex" : "none",
                      width: '100%'
                    }}
                    fullWidth
                  />
                </div>
              </FormRow>
            </>
          )}
          {formData.type === "regular" && (
            <>
              <FormRow>
                <TextField
                  id="duration"
                  label="Duração"
                  variant="outlined"
                  name="duration"
                  onChange={onchange}
                  value={formData.duration}
                />
                <Autocomplete
                  id="language"
                  freeSolo
                  options={languages.map((language) => language)}
                  name="language"
                  value={formData.language}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "language", value: newValue } });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="language"
                      onChange={onchange}
                      label="Idioma"
                    />
                  )}
                />
              </FormRow>
              <FormRow>
                <Autocomplete
                  id="local"
                  freeSolo
                  options={locals.map((local) => local)}
                  name="local"
                  value={formData.local}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "local", value: newValue } });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="local"
                      onChange={onchange}
                      label="Local"
                    />
                  )}
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
                      name="status"
                      onChange={onchange}
                      label="Status de Reserva"
                    />
                  )}
                />
              </FormRow>
              {paxEntries.map((entry, index) => {
                // Filtra os tipos de ingressos que já foram selecionados em outras linhas
                const usedTypes = paxEntries
                  .filter((e, i) => i !== index && e.type !== '')
                  .map(e => e.type);

                return (
                  <FormRow key={index}>
                <TextField
                      select
                      label="Tipo de Ingresso"
                      value={entry.type}
                      onChange={(e) => handlePaxTypeChange(index, e.target.value)}
                    >
                      {!usedTypes.includes('paxAdult') && (
                        <MenuItem value="paxAdult">Adulto</MenuItem>
                      )}
                      {!usedTypes.includes('paxHalf') && (
                        <MenuItem value="paxHalf">Meia</MenuItem>
                      )}
                      {!usedTypes.includes('paxFree') && (
                        <MenuItem value="paxFree">Cortesia</MenuItem>
                      )}
                      {!usedTypes.includes('paxNet') && (
                        <MenuItem value="paxNet">NET</MenuItem>
                      )}
                      {!usedTypes.includes('paxBrazilian') && (
                        <MenuItem value="paxBrazilian">Brasileiro</MenuItem>
                      )}
                    </TextField>
                    <TextField
                      label="Quantidade"
                  type="number"
                      value={entry.quantity}
                      onChange={(e) => handlePaxQuantityChange(index, e.target.value)}
                  InputProps={{
                    min: 0,
                  }}
                />
              </FormRow>
                );
              })}
              <FormRow>
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
              </FormRow>
              <FormRow>
                <Autocomplete
                  id="paymentStatus"
                  freeSolo
                  options={paymentStatus.map((status) => status)}
                  name="status"
                  value={formData.paymentStatus}
                  onChange={(event, newValue) => {
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
              </FormRow>
              <FormRow>
                <Autocomplete
                  id="client"
                  freeSolo
                  options={customers.map((customer) => customer.name)}
                  name="Cliente"
                  value={formData.client}
                  onChange={(event, newValue) => {
                    onchange({
                      target: { name: "client", value: newValue },
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="client"
                      onChange={onchange}
                      label="Cliente"
                    />
                  )}
                />
                <Autocomplete
                  id="clientName"
                  freeSolo
                  options={customerContactsOptions.map((customer) => ({
                    label: customer.contactName,
                    contact: customer.contactEmail,
                  }))}
                  name="Nome do Cliente"
                  value={formData.clientName}
                  onChange={(event, newValue) => {
                    onchange({
                      target: { name: "clientName", value: newValue },
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="clientName"
                      onChange={onchange}
                      label="Nome do Cliente"
                      inputProps={{
                        ...params.inputProps,
                        autoComplete: "clientName",
                      }}
                    />
                  )}
                />
              </FormRow>
              <FormRow>
                <TextField
                  id="clientContact"
                  label="Contato do Cliente"
                  variant="outlined"
                  name="clientContact"
                  onChange={onchange}
                  value={formData.clientContact}
                />
                <TextField
                  id="companionName"
                  label="Nome do Guia"
                  variant="outlined"
                  name="companionName"
                  onChange={onchange}
                  value={formData.companionName}
                />
              </FormRow>
              <FormRow>
                <TextField
                  id="companionContact"
                  label="Contato do Guia"
                  variant="outlined"
                  name="companionContact"
                  onChange={onchange}
                  value={formData.companionContact}
                />
                <FormControl fullWidth>
                  <InputLabel id="ceGuide-label">Guia do CE</InputLabel>
                  <Select
                    labelId="ceGuide-label"
                    id="ceGuide"
                    name="ceGuide"
                    label="Guia do CE"
                    multiple
                    renderValue={(selected) => selected.join(", ")}
                    value={formData.ceGuide}
                    onChange={onchange}
                  >
                    {guides.map((guide) => (
                      <MenuItem key={guide} value={guide}>
                        <Checkbox
                          checked={formData.ceGuide.indexOf(guide) > -1}
                        />
                        <ListItemText primary={guide} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </FormRow>
              <FormRow>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        id="comissioned"
                        name="commissioned"
                        onChange={onchange}
                        checked={formData.commissioned}
                      />
                    }
                    label="Comissionado"
                  />
                </FormGroup>
                <Textarea
                  minRows={4}
                  placeholder="Observações"
                  id="comments"
                  name="comments"
                  onChange={onchange}
                  value={formData.comments}
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
            </>
          )}
          {formData.type === "privativo" && (
            <>
              <FormRow>
                <TextField
                  id="duration"
                  label="Duração"
                  variant="outlined"
                  name="duration"
                  onChange={onchange}
                  value={formData.duration}
                />
                <Autocomplete
                  id="language"
                  freeSolo
                  options={languages.map((language) => language)}
                  name="language"
                  value={formData.language}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "language", value: newValue } });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="language"
                      onChange={onchange}
                      label="Idioma"
                    />
                  )}
                />
              </FormRow>
              <FormRow>
                <Autocomplete
                  id="local"
                  freeSolo
                  options={locals.map((local) => local)}
                  name="local"
                  value={formData.local}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "local", value: newValue } });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="local"
                      onChange={onchange}
                      label="Local"
                    />
                  )}
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
                      name="status"
                      onChange={onchange}
                      label="Status"
                    />
                  )}
                />
              </FormRow>
              <FormRow>
                <TextField
                  id="paxAdult"
                  label="Número de Pax"
                  variant="outlined"
                  name="paxAdult"
                  onChange={onchange}
                  value={formData.paxAdult}
                  type="number"
                />
                <TextField
                  id="numberOfGroups"
                  label="Número de Grupos"
                  variant="outlined"
                  name="numberOfGroups"
                  onChange={onchange}
                  value={formData.numberOfGroups}
                  type="number"
                />
              </FormRow>
              <FormRow>
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
                <Autocomplete
                  id="client"
                  freeSolo
                  options={customers.map((customer) => customer.name)}
                  name="Cliente"
                  value={formData.client}
                  onChange={(event, newValue) => {
                    onchange({
                      target: { name: "client", value: newValue },
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="client"
                      onChange={onchange}
                      label="Cliente"
                    />
                  )}
                />
              </FormRow>
              <FormRow>
                <Autocomplete
                  id="clientName"
                  freeSolo
                  options={customerContactsOptions.map((customer) => ({
                    label: customer.contactName,
                    contact: customer.contactContact,
                  }))}
                  name="Nome do Cliente"
                  value={formData.clientName}
                  onChange={(event, newValue) => {
                    onchange({
                      target: { name: "clientName", value: newValue },
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="clientName"
                      onChange={onchange}
                      label="Nome do Cliente"
                    />
                  )}
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
                <TextField
                  id="companionName"
                  label="Nome do Guia"
                  variant="outlined"
                  name="companionName"
                  onChange={onchange}
                  value={formData.companionName}
                />
                <TextField
                  id="companionContact"
                  label="Contato do Guia"
                  variant="outlined"
                  name="companionContact"
                  onChange={onchange}
                  value={formData.companionContact}
                />
              </FormRow>
              <FormRow>
                <FormControl fullWidth>
                  <InputLabel id="ceGuide-label">Guia do CE</InputLabel>
                  <Select
                    labelId="ceGuide-label"
                    id="ceGuide"
                    name="ceGuide"
                    label="Guia do CE"
                    multiple
                    renderValue={(selected) => selected.join(", ")}
                    value={formData.ceGuide}
                    onChange={onchange}
                  >
                    {guides.map((guide) => (
                      <MenuItem key={guide} value={guide}>
                        <Checkbox
                          checked={formData.ceGuide.indexOf(guide) > -1}
                        />
                        <ListItemText primary={guide} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <div style={{ width: '50%' }}>
                  <TextField
                    id="emailSubject"
                    label="Assunto do Email"
                    variant="outlined"
                    name="emailSubject"
                    onChange={onchange}
                    value={formData.emailSubject}
                    style={{ display: formData.platform === "Email" ? "block" : "none", width: '100%' }}
                  />
                </div>
              </FormRow>
              <FormRow>
                <div>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          id="comissioned"
                          name="commissioned"
                          onChange={onchange}
                          checked={formData.commissioned}
                        />
                      }
                      label="Comissionado"
                    />
                  </FormGroup>
                </div>
                <Textarea
                  minRows={4}
                  placeholder="Observações"
                  id="comments"
                  name="comments"
                  onChange={onchange}
                  value={formData.comments}
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
            </>
          )}
          {formData.type === "show/evento" && (
            <>
              <FormRow>
                <TextField
                  id="duration"
                  label="Duração"
                  variant="outlined"
                  name="duration"
                  onChange={onchange}
                  value={formData.duration}
                />
                <Autocomplete
                  id="local"
                  freeSolo
                  options={locals.map((local) => local)}
                  name="local"
                  value={formData.local}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "local", value: newValue } });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="local"
                      onChange={onchange}
                      label="Local"
                    />
                  )}
                />
              </FormRow>
              <FormRow>
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
                      name="status"
                      onChange={onchange}
                      label="Status"
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
              </FormRow>
              <FormRow>
                <Autocomplete
                  id="client"
                  freeSolo
                  options={customers.map((customer) => customer.name)}
                  name="Cliente"
                  value={formData.client}
                  onChange={(event, newValue) => {
                    onchange({
                      target: { name: "client", value: newValue },
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="client"
                      onChange={onchange}
                      label="Cliente"
                    />
                  )}
                />
                <Autocomplete
                  id="clientName"
                  freeSolo
                  options={customerContactsOptions.map((customer) => ({
                    label: customer.contactName,
                    contact: customer.contactContact,
                  }))}
                  name="Nome do Cliente"
                  value={formData.clientName}
                  onChange={(event, newValue) => {
                    onchange({
                      target: { name: "clientName", value: newValue },
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="clientName"
                      onChange={onchange}
                      label="Nome do Cliente"
                    />
                  )}
                />
              </FormRow>
              <FormRow>
                <TextField
                  id="clientContact"
                  label="Contato do Cliente"
                  variant="outlined"
                  name="clientContact"
                  onChange={onchange}
                  value={formData.clientContact}
                />
                <TextField
                  id="companionName"
                  label="Nome do Guia"
                  variant="outlined"
                  name="companionName"
                  onChange={onchange}
                  value={formData.companionName}
                />
              </FormRow>
              <FormRow>
                <TextField
                  id="companionContact"
                  label="Contato do Guia"
                  variant="outlined"
                  name="companionContact"
                  onChange={onchange}
                  value={formData.companionContact}
                />
              </FormRow>
              <FormRow>
                <div>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          id="comissioned"
                          name="commissioned"
                          onChange={onchange}
                          checked={formData.commissioned}
                        />
                      }
                      label="Comissionado"
                    />
                  </FormGroup>
                </div>
                <Textarea
                  minRows={4}
                  placeholder="Observações"
                  id="comments"
                  name="comments"
                  onChange={onchange}
                  value={formData.comments}
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
            </>
          )}
          <FormButtons>
            <Button variant="outlined" type="submit">
              Salvar
            </Button>
            <Button variant="outlined" type="submit" create-new="true">
              Salvar e Criar Outra
            </Button>
          </FormButtons>
        </FormBox>
        <ComissionModal opened={comissionModalOpened.toString()}>
          <ComissionModalHeader>
            <ComissionModalTitle>Comissão</ComissionModalTitle>
            <ComissionModalClose
              onClick={() => setComissionModalOpened(false)}
            />
          </ComissionModalHeader>
          <FormBox
            component="form"
            noValidate
            autoComplete="off"
            onSubmit={(e) => e.preventDefault()}
            status={formsStatus}
          >
            <FormRow>
              <TextField
                id="comissionersName"
                label="Nome do Comissionado"
                variant="outlined"
                name="comissionersName"
                onChange={onchange}
                value={formData.comissionersName}
              />
              <TextField
                id="comissionersContact"
                label="Contato do Comissionado"
                variant="outlined"
                name="comissionersContact"
                onChange={onchange}
                value={formData.comissionersContact}
              />
            </FormRow>
            <FormRow>
              <FormControl fullWidth>
                <InputLabel id="comission-currency-label">Moeda</InputLabel>
                <Select
                  labelId="comission-currency-label"
                  id="comissionCurrency"
                  label="Comission Currency"
                  name="comissionCurrency"
                  onChange={onchange}
                  value={formData.comissionCurrency}
                >
                  {currencies.map((currency) => {
                    return (
                      <MenuItem value={currency} key={currency}>
                        {currency}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <TextField
                id="comissionPrice"
                label="Valor da Comissão"
                variant="outlined"
                name="comissionPrice"
                onChange={onchange}
                value={formData.comissionPrice}
              />
            </FormRow>
            <FormRow>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      id="comissionPaid"
                      name="comissionPaid"
                      onChange={onchange}
                      checked={formData.comissionPaid}
                    />
                  }
                  label="Pago?"
                />
              </FormGroup>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      id="comissionByPercentage"
                      name="comissionByPercentage"
                      onChange={onchange}
                      checked={formData.comissionByPercentage}
                    />
                  }
                  label="Calcular por porcentagem?"
                />
              </FormGroup>
              <TextField
                id="comissionPercentage"
                label="Percentual de  comissão"
                variant="outlined"
                name="comissionPercentage"
                onChange={onchange}
                value={formData.comissionPercentage}
                type="number"
                max="100"
                style={{
                  display: formData.comissionByPercentage ? "block" : "none",
                }}
              />
            </FormRow>
            <Button
              onClick={() => setComissionModalOpened(false)}
              variant="outlined"
            >
              OK
            </Button>
          </FormBox>
        </ComissionModal>
      </Content>
    </Main>
  );
};

export default TourInput;

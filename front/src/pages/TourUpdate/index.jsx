import React, { useState, useCallback, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { forwardRef } from "react";
import { NumericFormat } from "react-number-format";

import Sidebar from "../../components/Sidebar";

import {
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Autocomplete,
  Checkbox,
  FormGroup,
  FormControlLabel,
  FormLabel,
  ListItemText,
  Chip,
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
  Table,
  ComissionModal,
  ComissionModalHeader,
  ComissionModalTitle,
  ComissionModalClose,
} from "./tourupdate";

import { useNavigate } from "react-router-dom";
import { formatMoney } from "../../utils/functions";
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

const TourUpdate = () => {
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const tourId = params.get("id");

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
    paxAdult: 0,
    paxHalf: 0,
    paxNet: 0,
    paxFree: 0,
    paxBrazilian: 0,
    currency: "R$",
    paymentMethod: "",
    paymentStatus: "",
    totalValue: "",
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
  const [locals, setLocals] = useState([]);
  const [guides, setGuides] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedAdditional, setSelectedAdditional] = useState(null);
  const [blockUpdateTotalValue, setBlockUpdateTotalValue] = useState(false);
  const [blockUpdateNumberOfGroups, setBlockUpdateNumberOfGroups] =
    useState(false);
  const [changeRequests, setChangeRequests] = useState([]);
  const [comissionModalOpened, setComissionModalOpened] = useState(false);

  const onchange = useCallback(
    async (e) => {
      //Cria change request
      let newChangeRequests = changeRequests;

      // Função para verificar se é um tour regular e se a data ainda não passou
      const isTourRegularAndDateNotPassed = () => {
        if (formData.type !== "regular") return false;
        
        // Usar comparação de string para evitar problemas de timezone
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + 
                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(today.getDate()).padStart(2, '0');
        
        // Retorna true se o tour for hoje ou no futuro
        return formData.tourDate >= todayStr;
      };

      if (e.target.name === "totalValue" && e.target.manuellement) {
        // Exceção para tours regulares que ainda não passaram
        if (isTourRegularAndDateNotPassed()) {
          // Atualiza diretamente sem criar changeRequest
          let newFormData = formData;
          newFormData[e.target.name] = e.target.value;
          setFormData(newFormData);
          setFormsStatus(Math.random());
          setBlockUpdateTotalValue(true);
          return;
        }
        
        // Lógica original para outros casos
        if (newChangeRequests.find((change) => change.type === "totalValue")) {
          if (
            newChangeRequests.find((change) => change.type === "totalValue")
              .oldValue === e.target.value
          )
            newChangeRequests = newChangeRequests.filter(
              (cr) => cr.type !== "totalValue"
            );
          else {
            newChangeRequests.find(
              (change) => change.type === "totalValue"
            ).newValue = e.target.value;
          }
        } else {
          newChangeRequests.push({
            type: "totalValue",
            newValue: e.target.value,
            name: "Valor Total",
            oldValue: formData.totalValue,
          });
        }
      } else if (e.target.name === "paymentMethod") {
        // Exceção para tours regulares que ainda não passaram
        if (isTourRegularAndDateNotPassed()) {
          // Atualiza diretamente sem criar changeRequest
          let newFormData = formData;
          newFormData[e.target.name] = e.target.value;
          setFormData(newFormData);
          setFormsStatus(Math.random());
          return;
        }
        
        // Lógica original para outros casos
        if (
          newChangeRequests.find((change) => change.type === "paymentMethod")
        ) {
          if (
            newChangeRequests.find((change) => change.type === "paymentMethod")
              .oldValue === e.target.value
          )
            newChangeRequests = newChangeRequests.filter(
              (cr) => cr.type !== "paymentMethod"
            );
          else {
            newChangeRequests.find(
              (change) => change.type === "paymentMethod"
            ).newValue = e.target.value;
          }
        } else {
          newChangeRequests.push({
            type: "paymentMethod",
            newValue: e.target.value,
            name: "Método de Pagamento",
            oldValue: formData.paymentMethod,
          });
        }
      } else if (e.target.name === "currency") {
        if (newChangeRequests.find((change) => change.type === "currency")) {
          if (
            newChangeRequests.find((change) => change.type === "currency")
              .oldValue === e.target.value
          )
            newChangeRequests = newChangeRequests.filter(
              (cr) => cr.type !== "currency"
            );
          else {
            newChangeRequests.find(
              (change) => change.type === "currency"
            ).newValue = e.target.value;
          }
        } else {
          newChangeRequests.push({
            type: "currency",
            newValue: e.target.value,
            name: "Moeda",
            oldValue: formData.currency,
          });
        }
      } else if (e.target.name === "paymentStatus") {
        if (
          newChangeRequests.find((change) => change.type === "paymentStatus")
        ) {
          if (
            newChangeRequests.find((change) => change.type === "paymentStatus")
              .oldValue === e.target.value
          )
            newChangeRequests = newChangeRequests.filter(
              (cr) => cr.type !== "paymentStatus"
            );
          else {
            newChangeRequests.find(
              (change) => change.type === "paymentStatus"
            ).newValue = e.target.value;
          }
        } else {
          newChangeRequests.push({
            type: "paymentStatus",
            newValue: e.target.value,
            name: "Status de Pagamento",
            oldValue: formData.paymentStatus,
          });
        }
      } else if (e.target.name === "commissioned") {
        let newFormData = formData;

        if (e.target.checked === false) {
          deleteComission(formData.commissionId, formData.orderRef);
        } else {
          newFormData.commissioned = true;
          setComissionModalOpened(true);
        }
        setFormData(newFormData);
        setFormsStatus(Math.random());
        return;
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
      if (e.target.name === "paxAdult") updateNumberOfGroups();
      if (e.target.name === "type") {
        newFormData.totalValue = 0;
        newFormData.activity = "";
        newFormData.duration = "";
        setSelectedProduct(null);
      }

      changeComissionPrice();
      setChangeRequests(newChangeRequests);
      setFormData(newFormData);
      setFormsStatus(Math.random());
    },
    [formData, activities, changeRequests]
  );

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if ([5].indexOf(userPermissions) !== -1) return;

      let body = { ...formData };
      // Converter array de países para string concatenada
      if (Array.isArray(body.country)) {
        body.country = body.country.join(", ");
      }
      body.changeRequests = changeRequests;
      body.createdBy = userName;
      body.lastEditBy = userName;

      fetch(`${API_URL}tours/update.php?id=${formData.id}`, {
        method: "POST",
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            MySwal.fire({
              title: <p>Sucesso</p>,
              html: <i>Tour atualizado com sucesso</i>,
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
    [formData, changeRequests, userName, userPermissions]
  );

  const updateNumberOfGroups = useCallback(() => {
    if (!blockUpdateNumberOfGroups && formData.type === "privativo") {
      let numberOfGroups = Math.ceil(formData.paxAdult / 25);
      let newForData = formData;
      newForData.numberOfGroups = numberOfGroups;
      setFormData(newForData);
      setFormsStatus(Math.random());
    }
  }, [formsStatus, formData, blockUpdateNumberOfGroups]);

  const changeComissionPrice = useCallback(
    (e) => {
      if (formData.comissionByPercentage) {
        const price = (
          0.01 *
          parseFloat(formData.comissionPercentage) *
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

  const deleteComission = useCallback(
    (commissionId, orderRef) => {
      MySwal.fire({
        title: `Tem certeza que deseja remover a comissão relacionada ao pedido ${orderRef}?`,
        showCancelButton: true,
        confirmButtonText: "Yes",
      }).then((result) => {
        if (result.isConfirmed) {
          if (!commissionId) {
            let newFormData = formData;
            newFormData.commissioned = false;
            newFormData.comissionByPercentage = false;
            newFormData.comissionCurrency = "";
            newFormData.comissionPaid = false;
            newFormData.comissionersContact = "";
            newFormData.comissionersName = "";
            newFormData.comissionPrice = "";
            setFormData(newFormData);
            setFormsStatus(Math.random());
            return;
          }
          fetch(`${API_URL}comissions/delete.php?id=${commissionId}`, {
            method: "POST",
          })
            .then((response) => response.json())
            .then((response) =>
              Swal.fire("Comissão removida com sucesso!!", "", "success").then(
                () => {
                  let newFormData = formData;
                  newFormData.commissioned = false;
                  newFormData.comissionByPercentage = false;
                  newFormData.comissionCurrency = "";
                  newFormData.comissionPaid = false;
                  newFormData.comissionersContact = "";
                  newFormData.comissionersName = "";
                  newFormData.comissionPrice = "";
                  setFormData(newFormData);
                  setFormsStatus(Math.random());
                }
              )
            );
        }
      });
    },
    [formData]
  );

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

    fetch(`${API_URL}settings/payment-status.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setPaymentStatus(transformedData);
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
    
    const paxAdult = parseInt(formData.paxAdult || 0);
    const paxHalf = parseInt(formData.paxHalf || 0);
    const paxNet = parseInt(formData.paxNet || 0);
    const paxBrazilian = parseInt(formData.paxBrazilian || 0);

    let paxTotal =
      formData.type === "regular"
        ? paxAdult + paxHalf + paxNet + paxBrazilian
        : paxAdult;

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
          const adultPrice = parseInt(selectedVariant.priceAdultHighSeason) === 0
            ? parseInt(selectedVariant.priceAdult || 0)
            : parseInt(selectedVariant.priceAdultHighSeason || 0);
          const halfPrice = parseInt(selectedVariant.priceHalfHighSeason) === 0
            ? parseInt(selectedVariant.priceHalf || 0)
            : parseInt(selectedVariant.priceHalfHighSeason || 0);
          const netPrice = parseInt(selectedVariant.priceNetHighSeason) === 0
            ? parseInt(selectedVariant.priceNet || 0)
            : parseInt(selectedVariant.priceNetHighSeason || 0);
          const brazilianPrice = parseInt(selectedVariant.priceBrazilianHighSeason) === 0
            ? parseInt(selectedVariant.priceBrazilian || 0)
            : parseInt(selectedVariant.priceBrazilianHighSeason || 0);
          return paxAdult * adultPrice + paxHalf * halfPrice + paxNet * netPrice + paxBrazilian * brazilianPrice;
        } else {
          return (
            paxAdult * parseInt(selectedVariant.priceAdult || 0) +
            paxHalf * parseInt(selectedVariant.priceHalf || 0) +
            paxNet * parseInt(selectedVariant.priceNet || 0) +
            paxBrazilian * parseInt(selectedVariant.priceBrazilian || 0)
          );
        }
      } else {
        if (formData.isHighSeason) {
          const groupPrice = parseInt(selectedVariant.priceGroupHighSeason) === 0
            ? parseInt(selectedVariant.priceGroup || 0)
            : parseInt(selectedVariant.priceGroupHighSeason || 0);
          return parseInt(formData.numberOfGroups || 0) * groupPrice;
        } else {
          return parseInt(formData.numberOfGroups || 0) * parseInt(selectedVariant.priceGroup || 0);
        }
      }
    };

    let totalValue = calcVariantValue(selectedProduct, paxTotal);
    if (selectedAdditional) {
      totalValue += calcVariantValue(selectedAdditional, paxTotal);
    }

    let newFormData = formData;

    let oldTotalValue = formData.totalValue;
    newFormData.totalValue = totalValue;

    if (oldTotalValue !== totalValue) {
      setFormData(newFormData);
      setFormsStatus(Math.random());
    }
  }, [selectedProduct, selectedAdditional, formData, formsStatus]);

  useEffect(() => {
    if (!tourId) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Tour não encontrado!",
      }).then(() => {
        navigate("/listar-tours-financeiro");
      });
    } else {
      fetch(`${API_URL}tours/list-by-id.php?tour_id=${tourId}`, {
        method: "GET",
      })
        .then((response) => response.json())
        .then((response) => {
          let transformedData = response;
          transformedData.commissioned =
            transformedData.commissioned === "1" ? true : false;
          transformedData.comissionPaid =
            transformedData.comissionPaid === "1" ? true : false;
          transformedData.isHighSeason =
            transformedData.isHighSeason === "1" ? true : false;
          transformedData.comissionCurrency = transformedData.comissionCurrency
            ? transformedData.comissionCurrency.trim()
            : "";
          transformedData.comissionByPercentage = false;
          transformedData.comissionPercentage = 0;
          if (transformedData.ceGuide === "") transformedData.ceGuide = [];
          else transformedData.ceGuide = transformedData.ceGuide.split(",");
          
          // Tratar o campo country como array
          if (transformedData.country === "" || transformedData.country === null) {
            transformedData.country = [];
          } else if (typeof transformedData.country === "string") {
            transformedData.country = transformedData.country.split(",");
          }

          setFormData(transformedData);
          setChangeRequests(response.changeRequests);
        });
    }
  }, []);

  return (
    <Main>
      <Sidebar></Sidebar>
      <Content>
        <SubTitle>Tour</SubTitle>
        <Title>Editar</Title>
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
                  value={formData.platform || ""}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "platform", value: newValue || "" } });
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
                  value={formData.activity || ""}
                  onChange={(e, newValue) => {
                    onchange({
                      target: { name: "activity", value: newValue || "" },
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
                  value={formData.adicional || ""}
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
                  value={formData.language || ""}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "language", value: newValue || "" } });
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
                  value={formData.local || ""}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "local", value: newValue || "" } });
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
                  value={formData.status || ""}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "status", value: newValue || "" } });
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
                  id="pax-adult"
                  label="Pax Adulto"
                  variant="outlined"
                  name="paxAdult"
                  onChange={onchange}
                  value={formData.paxAdult}
                  type="number"
                  InputProps={{
                    min: 0,
                  }}
                />
                <TextField
                  id="pax-half"
                  label="Pax Meia"
                  variant="outlined"
                  name="paxHalf"
                  onChange={onchange}
                  value={formData.paxHalf}
                  type="number"
                  InputProps={{
                    min: 0,
                  }}
                />
              </FormRow>
              <FormRow>
                <TextField
                  id="pax-free"
                  label="Pax Free"
                  variant="outlined"
                  name="paxFree"
                  onChange={onchange}
                  value={formData.paxFree}
                  type="number"
                  InputProps={{
                    min: 0,
                  }}
                />
                <TextField
                  id="pax-net"
                  label="Pax NET"
                  variant="outlined"
                  name="paxNet"
                  onChange={onchange}
                  value={formData.paxNet}
                  type="number"
                  InputProps={{
                    min: 0,
                  }}
                />
                <TextField
                  id="pax-brazilian"
                  label="Pax Brasileiro"
                  variant="outlined"
                  name="paxBrazilian"
                  onChange={onchange}
                  value={formData.paxBrazilian}
                  type="number"
                  InputProps={{
                    min: 0,
                  }}
                />
              </FormRow>
              <FormRow>
                <Autocomplete
                  id="currency"
                  freeSolo
                  options={currencies.map((currency) => currency)}
                  name="currency"
                  value={formData.currency || ""}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "currency", value: newValue || "" } });
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
                  value={formData.paymentMethod || ""}
                  onChange={(event, newValue) => {
                    onchange({
                      target: { name: "paymentMethod", value: newValue || "" },
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
                  name="paymentStatus"
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
                <TextField
                  id="client"
                  label="Cliente"
                  variant="outlined"
                  name="client"
                  onChange={onchange}
                  value={formData.client || ""}
                />
                <TextField
                  id="clientName"
                  label="Nome do Cliente"
                  variant="outlined"
                  name="clientName"
                  onChange={onchange}
                  value={formData.clientName || ""}
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
                <div style={{ width: '50%', display: 'flex' }}>
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
                <div style={{ width: '50%' }}>
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
              </FormRow>
              <FormRow>
                <div>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          id="commissioned"
                          name="commissioned"
                          onChange={onchange}
                          checked={formData.commissioned}
                        />
                      }
                      label="Comissionado"
                    />
                  </FormGroup>
                  {formData.commissioned && (
                    <div>
                      <Button
                        variant="outlined"
                        style={{ marginRight: 20 }}
                        onClick={() => setComissionModalOpened(true)}
                      >
                        Editar Comissão
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() =>
                          deleteComission(
                            formData.commissionId,
                            formData.orderRef
                          )
                        }
                      >
                        Remover Comissão
                      </Button>
                    </div>
                  )}
                </div>
                <FormControl>
                  <FormLabel>Observações Escritório</FormLabel>
                  <Textarea
                    minRows={4}
                    placeholder="Observações Escritório"
                    id="comments"
                    name="comments"
                    onChange={onchange}
                    value={formData.comments}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Histórico da Conversa</FormLabel>
                  <Textarea
                    minRows={4}
                    placeholder="Histórico da Conversa"
                    id="conversationHistory"
                    name="conversationHistory"
                    onChange={onchange}
                    value={formData.conversationHistory}
                  />
                </FormControl>
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
                  value={formData.language || ""}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "language", value: newValue || "" } });
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
                  value={formData.local || ""}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "local", value: newValue || "" } });
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
                  value={formData.status || ""}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "status", value: newValue || "" } });
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
                  value={formData.currency || ""}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "currency", value: newValue || "" } });
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
                  value={formData.paymentMethod || ""}
                  onChange={(event, newValue) => {
                    onchange({
                      target: { name: "paymentMethod", value: newValue || "" },
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
                  id="paymentStatus"
                  freeSolo
                  options={paymentStatus.map((status) => status)}
                  name="paymentStatus"
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
              </FormRow>
              <FormRow>
                <TextField
                  id="client"
                  label="Cliente"
                  variant="outlined"
                  name="client"
                  onChange={onchange}
                  value={formData.client || ""}
                />
                <TextField
                  id="clientName"
                  label="Nome do Cliente"
                  variant="outlined"
                  name="clientName"
                  onChange={onchange}
                  value={formData.clientName || ""}
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
                <div style={{ width: '50%', display: 'flex' }}>
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
                <div style={{ width: '50%' }}>
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
              </FormRow>
              <FormRow>
                <div>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          id="commissioned"
                          name="commissioned"
                          onChange={onchange}
                          checked={formData.commissioned}
                        />
                      }
                      label="Comissionado"
                    />
                  </FormGroup>
                  {formData.commissioned && (
                    <div>
                      <Button
                        variant="outlined"
                        style={{ marginRight: 20 }}
                        onClick={() => setComissionModalOpened(true)}
                      >
                        Editar Comissão
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() =>
                          deleteComission(
                            formData.commissionId,
                            formData.orderRef
                          )
                        }
                      >
                        Remover Comissão
                      </Button>
                    </div>
                  )}
                </div>
                <FormControl>
                  <FormLabel>Observações Escritório</FormLabel>
                  <Textarea
                    minRows={4}
                    placeholder="Observações Escritório"
                    id="comments"
                    name="comments"
                    onChange={onchange}
                    value={formData.comments}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Histórico da Conversa</FormLabel>
                  <Textarea
                    minRows={4}
                    placeholder="Histórico da Conversa"
                    id="conversationHistory"
                    name="conversationHistory"
                    onChange={onchange}
                    value={formData.conversationHistory}
                  />
                </FormControl>
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
                  value={formData.local || ""}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "local", value: newValue || "" } });
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
                  value={formData.status || ""}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "status", value: newValue || "" } });
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
                  value={formData.currency || ""}
                  onChange={(event, newValue) => {
                    onchange({ target: { name: "currency", value: newValue || "" } });
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
                  value={formData.paymentMethod || ""}
                  onChange={(event, newValue) => {
                    onchange({
                      target: { name: "paymentMethod", value: newValue || "" },
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
                  id="paymentStatus"
                  freeSolo
                  options={paymentStatus.map((status) => status)}
                  name="paymentStatus"
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
                  id="client"
                  label="Cliente"
                  variant="outlined"
                  name="client"
                  onChange={onchange}
                  value={formData.client || ""}
                />
              </FormRow>
              <FormRow>
                <TextField
                  id="clientName"
                  label="Nome do Cliente"
                  variant="outlined"
                  name="clientName"
                  onChange={onchange}
                  value={formData.clientName || ""}
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
                <div style={{ width: '50%', display: 'flex' }}>
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
                <div style={{ width: '50%' }}>
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
              </FormRow>
              <FormRow>
                <div>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          id="commissioned"
                          name="commissioned"
                          onChange={onchange}
                          checked={formData.commissioned}
                        />
                      }
                      label="Comissionado"
                    />
                  </FormGroup>
                  {formData.commissioned && (
                    <div>
                      <Button
                        variant="outlined"
                        style={{ marginRight: 20 }}
                        onClick={() => setComissionModalOpened(true)}
                      >
                        Editar Comissão
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() =>
                          deleteComission(
                            formData.commissionId,
                            formData.orderRef
                          )
                        }
                      >
                        Remover Comissão
                      </Button>
                    </div>
                  )}
                </div>

                <FormControl>
                  <FormLabel>Observações Escritório</FormLabel>
                  <Textarea
                    minRows={4}
                    placeholder="Observações Escritório"
                    id="comments"
                    name="comments"
                    onChange={onchange}
                    value={formData.comments}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Histórico da Conversa</FormLabel>
                  <Textarea
                    minRows={4}
                    placeholder="Histórico da Conversa"
                    id="conversationHistory"
                    name="conversationHistory"
                    onChange={onchange}
                    value={formData.conversationHistory}
                  />
                </FormControl>
              </FormRow>
            </>
          )}
          {changeRequests.length > 0 && (
            <>
              <Title nomargin="true">
                Alterações a serem aprovadas pelo financeiro
              </Title>
              <Table>
                <thead>
                  <tr>
                    <th>Campo</th>
                    <th>Valor Antigo</th>
                    <th>Novo Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {changeRequests.map((request) => (
                    <tr key={request.type}>
                      <td>{request.name}</td>
                      <td>
                        {request.name === "Valor Total"
                          ? formatMoney(request.oldValue)
                          : request.oldValue}
                      </td>
                      <td>
                        {request.name === "Valor Total"
                          ? formatMoney(request.newValue)
                          : request.newValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
          <FormButtons>
            <Button variant="outlined" type="submit">
              Salvar
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
                  value={formData.comissionCurrency || ""}
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

export default TourUpdate;

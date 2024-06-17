import { useState, useEffect } from "react";
import { Card, TextContainer, Text, Banner } from "@shopify/polaris";
import { Toast } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

const label = { inputProps: { 'aria-label': 'Switch demo' } };

export function ProductsCard() {
  const emptyToastProps = { content: null };
  const [isLoading, setIsLoading] = useState(true);
  const [toastProps, setToastProps] = useState(emptyToastProps);
  const [carrierServices, setCarrierServices] = useState([]);
  const [responseMessage, setResponseMessage] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  useEffect(() => {
    carrierApiGet();
    setToggle();
  }, []); // The empty array ensures the effect runs only on the initial render
  const fetch = useAuthenticatedFetch();
  const { t } = useTranslation();
  const productsCount = 5;

  const {
    data,
    refetch: refetchProductCount,
    isLoading: isLoadingCount,
    isRefetching: isRefetchingCount,
  } = useAppQuery({
    url: "/api/products/count",
    reactQueryOptions: {
      onSuccess: () => {
        setIsLoading(false);
      },
    },
  });

  const toastMarkup = toastProps.content && !isRefetchingCount && (
    <Toast {...toastProps} onDismiss={() => setToastProps(emptyToastProps)} />
  );

  const handlePopulate = async () => {
    setIsLoading(true);
    const response = await fetch("/api/products/create");

    if (response.ok) {
      await refetchProductCount();
      setToastProps({
        content: t("ProductsCard.productsCreatedToast", {
          count: productsCount,
        }),
      });
    } else {
      setIsLoading(false);
      setToastProps({
        content: t("ProductsCard.errorCreatingProductsToast"),
        error: true,
      });
    }
  };

  const carrierApiGet = async () => {
    try {
      const request = await fetch("/api/carrier_services", {
        method: "GET",
      });
      const response = await request.json();
      setCarrierServices(response.data);
      //setResponseMessage("Carrier services fetched successfully.");
      console.log(response);
    } catch (error) {
      //setResponseMessage("Error fetching carrier services.");
      console.log(error);
    }
  };
  
  const setToggle = async () => {
    try {
      const request = await fetch("/api/carrier_services_status", {
        method: "GET",
      });
      const response = await request.json();
      console.log(response);
      if(response.carrierStatus == 1)
      {
        console.log("Inside If");
        setIsChecked(true);
      }
      else{
        console.log("Inside else");
        setIsChecked(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  
  const carrierApiCreate = async () => {
    try {
      const request = await fetch("/api/carrierservice/create", {
        method: "POST",
      });
      const response = await request.json();
      setResponseMessage("Carrier service enabled successfully.");
      
      console.log(response);
    } catch (error) {
      setResponseMessage("Error creating carrier service.");
      console.log(error);
    }
  };
  
  const carrierApiDelete = async () => {
    try {
      const request = await fetch("/api/carrierservice/delete", {
        method: "DELETE",
      });
      const response = await request.json();
      setResponseMessage("Carrier service disable successfully.");
      //setIsChecked(false);
      console.log(response);
    } catch (error) {
      setResponseMessage("Error deleting carrier service.");
      console.log(error);
    }
  };

  const handleChange = (event) => {
    if (event.target.checked) {
      setIsChecked(true);
      carrierApiCreate();
    } else {
      setIsChecked(false);
      carrierApiDelete();
    }
  };

  return (
    <>
      {toastMarkup}
      <Card title={t("ProductsCard.title")} sectioned>
        {responseMessage && (
          <Banner status={responseMessage.includes("Error") ? "critical" : "success"}>
            <Text>{responseMessage}</Text>
          </Banner>
        )}
        {/* <button onClick={carrierApiGet} className="button">
          Get carrier service List
        </button>
        <button onClick={carrierApiCreate} className="button">
          Create carrier service
        </button>
        <button onClick={carrierApiDelete} className="button">
          Delete carrier service
        </button> */}
        <FormGroup>
          <FormControlLabel
            control={<Switch onChange={handleChange} checked={isChecked} />}
            label="Enable UBER Carrier Service API"
          />
          {carrierServices.length > 0 && (
            <TextContainer>
              <Text variant="bodyMd" as="h3">
                Carrier Services:
              </Text>
              {carrierServices.map((service) => (
                <Text variant="bodyMd" as="p" key={service.id}>
                  {service.id} - {service.name} - {service.callback_url}
                </Text>
              ))}
            </TextContainer>
          )}
        </FormGroup>
      </Card>
    </>
  );
}

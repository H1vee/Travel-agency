declare function useLabelPlacement(props: {
    labelPlacement?: "inside" | "outside" | "outside-left";
    label?: React.ReactNode;
}): "inside" | "outside" | "outside-left";

export { useLabelPlacement };

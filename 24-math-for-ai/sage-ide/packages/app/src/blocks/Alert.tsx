import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { ActionIcon, Menu } from "@mantine/core";
import { MdCancel, MdCheckCircle, MdError, MdInfo } from "react-icons/md";
import "./Alert.css";
import { ReactNode } from "react";

export const alertTypes = [
  {
    title: "경고",
    value: "warning",
    icon: MdError,
    color: "#e69819",
    backgroundColor: {
      light: "#fff6e6",
      dark: "#805d20",
    },
  },
  {
    title: "오류",
    value: "error",
    icon: MdCancel,
    color: "#d80d0d",
    backgroundColor: {
      light: "#ffe6e6",
      dark: "#802020",
    },
  },
  {
    title: "정보",
    value: "info",
    icon: MdInfo,
    color: "#507aff",
    backgroundColor: {
      light: "#e6ebff",
      dark: "#203380",
    },
  },
  {
    title: "성공",
    value: "success",
    icon: MdCheckCircle,
    color: "#36be36",
    backgroundColor: {
      light: "#e6ffe6",
      dark: "#208020",
    },
  },
] as const;

type AlertType = typeof alertTypes[number];

export const Alert = createReactBlockSpec(
  {
    type: "alert",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      type: {
        default: "warning",
        values: ["warning", "error", "info", "success"],
      },
    },
    content: "inline",
  },
  {
    render(props) {
      const alertType = alertTypes.find((a) => a.value === props.block.props.type)!;

      return (
        <AlertView
          type={alertType}
          iconWrapper={(icon) => (
            <Menu withinPortal={false} zIndex={999999}>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">{icon}</ActionIcon>
              </Menu.Target>

              {/* Dropdown to change the Alert type */}
              <Menu.Dropdown>
                <Menu.Label>박스 유형</Menu.Label>
                <Menu.Divider />
                {alertTypes.map((type) => {
                  const ItemIcon = type.icon;

                  return (
                    <Menu.Item
                      key={type.value}
                      leftSection={(
                        <ItemIcon
                          className="alert-icon"
                          data-alert-icon-type={type.value}
                        />
                      )}
                      onClick={() =>
                        props.editor.updateBlock(props.block, {
                          type: "alert",
                          props: { type: type.value },
                        })}
                    >
                      {type.title}
                    </Menu.Item>
                  );
                })}
              </Menu.Dropdown>
            </Menu>
          )}
        >
          {/* Rich text field for user to type in */}
          <div className="inline-content" ref={props.contentRef} />
        </AlertView>
      );
    },
    toExternalHTML({ block, contentRef }) {
      const { type } = block.props;
      const alertType = alertTypes.find((a) => a.value === type)!;
      return (
        <AlertView type={alertType}>
          <div className="inline-content" ref={contentRef} />
        </AlertView>
      );
    },
    parse(el) {
      if(el.className !== "alert") return;
      const type = el.dataset.alertType;
      if(!type) return;
      if(!alertTypes.find((a) => a.value === type)) return;

      return { type: type as AlertType["value"] };
    },
  },
);

function AlertView(
  { type, children, iconWrapper = (icon) => icon }: {
    type: AlertType;
    children: ReactNode;
    iconWrapper?: (icon: ReactNode) => ReactNode;
  },
) {
  const Icon = type.icon;

  return (
    <div className="alert" data-alert-type={type.value}>
      {iconWrapper(
        <div className="alert-icon-wrapper">
          <Icon
            className="alert-icon"
            data-alert-icon-type={type.value}
            size={32}
          />
        </div>,
      )}
      {children}
    </div>
  );
}

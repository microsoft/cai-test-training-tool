/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { Icon } from "office-ui-fabric-react/lib/Icon";
import {
  TooltipHost,
  DirectionalHint,
} from "office-ui-fabric-react/lib/Tooltip";
import { FontSizes } from "@uifabric/fluent-theme";
import { NeutralColors, CommunicationColors } from "@uifabric/fluent-theme";
import { Link } from "@fluentui/react";

// -------------------- Styles -------------------- //

const link = (active, disabled) => css`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: ${disabled ? "#999" : "#4f4f4f"};
  position: relative;

  width: 220px;

  ${active
    ? `background-color: ${NeutralColors.white};

     border-left: 3px solid ${CommunicationColors.primary};
    `
    : `
     background-color: transparent;
    `}

  ${disabled
    ? `pointer-events: none;`
    : `&:hover {
      background-color: ${NeutralColors.gray50};
    }
    &:focus {
      outline: none;
      .ms-Fabric--isFocusVisible &::after {
        content: "";
        position: absolute;
        z-index: 1;
        border: 1px solid ${NeutralColors.white};
        border-image: initial;
        outline: rgb(102, 102, 102) solid 1px;
      }
    }
  `}
`;

const icon = (active, disabled) => ({
  root: {
    color: active ? "#000" : disabled ? "#999" : "#4f4f4f",
    padding: "8px 12px",
    marginLeft: active ? "1px" : "4px",
    marginRight: "12px",
    boxSizing: "border-box",
    fontSize: `${FontSizes.size16}`,
    width: "40px",
    height: "32px",
  },
});

// -------------------- NavItem -------------------- //

export const NavItem = (props) => {
  const { area, to, iconName, labelName, disabled, showTooltip } = props;

  const active = area == "/" ? window.location.pathname.toString() == area : window.location.pathname.toString().startsWith(area);

  const iconElement = (
    <Icon iconName={iconName} styles={icon(active, disabled)} />
  );
  const activeArea = (
    <div
      aria-disabled={disabled}
      aria-hidden="true"
      css={link(active, disabled)}
      data-testid={active ? "ActiveLeftNavItem" : undefined}
      tabIndex={-1}
    >
      {showTooltip ? (
        <TooltipHost
          content={labelName}
          directionalHint={DirectionalHint.rightCenter}
          styles={{ root: { height: 32 } }}
        >
          {iconElement}
        </TooltipHost>
      ) : (
        iconElement
      )}
      {labelName}
    </div>
  );

  return (
    <Link
      aria-disabled={disabled}
      aria-label={labelName + (active ? "; selected" : "")}
      css={css`
        display: block;

        :link {
          text-decoration: none;
        }
        :visited {
          text-decoration: none;
        }

        :focus {
          outline: none;
          position: relative;

          &::after {
            content: "";
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            border: 1px solid black;
          }
        }
      `}
      data-testid={"LeftNav-CommandBarButton" + labelName}
      href={to}
    >
      {activeArea}
    </Link>
  );
};

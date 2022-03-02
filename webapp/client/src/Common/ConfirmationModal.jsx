import { DefaultButton, getTheme, IconButton, mergeStyleSets, Modal, PrimaryButton, Stack, FontWeights} from '@fluentui/react';
import { useTranslation } from 'react-i18next';

const cancelIcon = { iconName: 'Cancel' };

const theme = getTheme();
const stackTokens = { childrenGap: '5%' };

const modalStyles = mergeStyleSets({
  container: {
    display: 'flex',
    flexFlow: 'column nowrap',
    alignItems: 'stretch',
    maxWidth: '25%'
  },
  header: [
    theme.fonts.xLargePlus,
    {
      flex: '1 1 auto',
      borderTop: `4px solid ${theme.palette.themePrimary}`,
      color: theme.palette.neutralPrimary,
      display: 'flex',
      alignItems: 'center',
      fontWeight: FontWeights.semibold,
      padding: '12px 12px 14px 24px',
    },
  ],
  body: {
    flex: '4 4 auto',
    padding: '0 24px 24px 24px',
    overflowY: 'hidden',
    selectors: {
      p: { margin: '14px 0' },
      'p:first-child': { marginTop: 0 },
      'p:last-child': { marginBottom: 0 },
    },
  },
  buttons: {
    flex: '1 1 auto',
    display: 'flex',
    alignItems: 'center',
    padding: '0px 32px 24px 24px',
    marginLeft: 'auto',
    width: 'fit-content'
  }
});

const modelIconButtonStyles = {
  root: {
    color: theme.palette.neutralPrimary,
    marginLeft: 'auto',
    marginTop: '4px',
    marginRight: '2px',
  },
  rootHovered: {
    color: theme.palette.neutralDark,
  },
};

export const ConfirmationModal = (params) => {
  const { t } = useTranslation();

  return (
    <Modal
        isOpen={params.isModalOpen}
        onDismiss={params.noHandle}
        containerClassName={modalStyles.container}
        isBlocking={true}
      >
        <div className={modalStyles.header}>
          <span>{params.modalTitle}</span>
          <IconButton
            styles={modelIconButtonStyles}
            iconProps={cancelIcon}
            ariaLabel="Close popup modal"
            onClick={params.noHandle}
          />
        </div>
        <div>
          <p className={modalStyles.body} dangerouslySetInnerHTML={{ __html: params.modalText }}>
          </p>
          <div>
            <Stack horizontal tokens={stackTokens} className={modalStyles.buttons}>
              <DefaultButton text={t("General_No")} onClick={params.noHandle}></DefaultButton>
              <PrimaryButton text={t("General_Yes")} onClick={()=>params.yesHandle(params.selectedItem)}></PrimaryButton>
            </Stack>
          </div>
        </div>
      </Modal>
  );
};

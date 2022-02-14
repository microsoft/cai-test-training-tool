import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import formatMessage from 'format-message';
import { mergeStyles } from '@fluentui/react';

const spinnerStyle = mergeStyles({ height: '100vh', width: '100%', display: 'flex', alignItems:"center", justifyContent: 'center'});

export const LoadingSpinner = (props) => {
  const { message } = props;
  return (
    <div>
      <Spinner className={spinnerStyle} label={message || formatMessage('Loading')} />
    </div>
  );
};

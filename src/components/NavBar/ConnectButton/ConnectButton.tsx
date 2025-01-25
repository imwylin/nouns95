import React from 'react';
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import styles from './ConnectButton.module.css';

const ConnectButton = () => {
  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                type="button"
                className={styles.connectButton}
              >
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={openAccountModal}
                type="button"
                className={styles.accountButton}
                style={{ pointerEvents: 'auto' }}
              >
                <div className={styles.buttonContent}>
                  {account.ensAvatar && (
                    <img
                      src={account.ensAvatar}
                      alt="ENS Avatar"
                      className={styles.ensAvatar}
                    />
                  )}
                  <span className={styles.buttonText}>
                    {account.displayName}
                  </span>
                  <span className={styles.balanceText}>
                    {account.displayBalance}
                  </span>
                </div>
              </button>
            )}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
};

export default ConnectButton;
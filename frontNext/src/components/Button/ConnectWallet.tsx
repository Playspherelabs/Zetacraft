// connectWallet.tsx
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import styled from "styled-components";

const StyledButton = styled.button`
  cursor: pointer;
  position: relative;
  display: inline-block;
  padding: 8px 16px;
  color: #ffffff;
  background: #00E0CA;
  font-size: 16px;
  font-weight: 500;
  border-radius: 0.5rem;
  box-shadow: 0 4px 24px -6px #00E0CA;
  transition: 200ms ease;
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 6px 40px -6px #00E0CA;
  }
  &:active {
    transform: translateY(-3px);
    box-shadow: 0 6px 32px -6px #00E0CA;
  }
`;

export const ConnectWallet = ({ buttonText = "Connect Wallet" }) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const truncateAddress = (address: string | any[] | undefined) => {
    return `${address?.slice(0, 6)}...${address?.slice(-4)}`;
  };

  if (isConnected) {
    return (
      <StyledButton onClick={() => disconnect()}>
        {truncateAddress(address)}
      </StyledButton>
    );
  }

  return (
    <StyledButton onClick={() => connect({ connector: connectors[0] })}>
      {buttonText}
    </StyledButton>
  );
};

A simple vite + viem + wagmi frontend to recover funds stuck in:

1. PonziDAO: https://juicebox.money/p/ponzidao
2. RobDAO: https://juicebox.money/p/robdao

Make sure to execute transactions from the address that owns the project you want to recover funds for.

The recovery process for RobDAO:

1. Connect wallet (button 1).
2. Call `configure(...)` (button 2), starting a new cycle for the project. This cycle will have a 1000 ETH payout to the owner's address and everything else turned off.
3. Wait 7 days, then call `tap(...)` (button 3), sending payouts for the project.

A tenderly fork simulation of this process is available at  https://dashboard.tenderly.co/explorer/fork/3f78b95e-828b-415e-b96a-744321faed17/transactions

Since PonziDAO's current cycle is permanently locked, we'll have to use an emergency terminal to recover the funds. The recovery process for PonziDAO:

1. Submit a proposal to JuiceboxDAO to approve PonziDAO's project (ID 140) for recovery.
2. Connect wallet (button 1).
3. Call `migrate(...)` (button 2) to migrate funds to the rescue terminal.
4. Call `rescue(...)` (button 3) to rescue funds from the terminal. These will be sent to the project owner's address.

A tenderly fork simulation of this process is available at https://dashboard.tenderly.co/explorer/fork/b30de472-2b55-4844-a88f-00c15145c9fd/transactions

There may be mistakes here. Use this at your own risk.
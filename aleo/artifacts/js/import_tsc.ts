import {
  ContractConfig,
  zkGetMapping,
  LeoAddress,
  LeoRecord,
  js2leo,
  leo2js,
  ExternalRecord,
  ExecutionMode,
  ExecutionContext,
  CreateExecutionContext,
  TransactionResponse
} from "@doko-js/core";
import {
  BaseContract
} from "../../contract/base-contract";
import {
  TransactionModel
} from "@provablehq/sdk";
import * as receipt from "./transitions/import_tsc";

export class Import_tscContract extends BaseContract {

  constructor(config: Partial < ContractConfig > = {
    mode: ExecutionMode.LeoRun
  }) {
    super({
      ...config,
      appName: 'import_tsc',
      fee: '0.01',
      contractPath: 'artifacts/leo/import_tsc',
      isImportedAleo: false
    });
  }
  async main(): Promise < TransactionResponse < TransactionModel & receipt.Import_tscMainTransition, [bigint] >> {

    const params = []
    const result = await this.ctx.execute('main', params);
    result.set_converter_fn([leo2js.u128]);
    return result
  }


}
<script setup lang="ts">
const economy = useEconomy();
const { t, locale } = useI18n();

const policy = computed(() => economy.policy.value);

const formattedReferenceValue = computed(() => {
  const value = policy.value?.referenceValueToman ?? economy.unit.value?.referenceValueToman ?? 0;
  return new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US").format(value);
});

const earnItems = computed(() => {
  const issuance = policy.value?.issuance;
  if (!issuance) return [];

  return [
    {
      key: "accountCreated",
      icon: "person_add",
      amount: issuance.accountCreated,
      label: t("growth.goin.earn.accountCreated.title"),
      helper: t("growth.goin.earn.accountCreated.helper"),
    },
    {
      key: "profileEmailAdded",
      icon: "alternate_email",
      amount: issuance.profileEmailAdded,
      label: t("growth.goin.earn.profileEmailAdded.title"),
      helper: t("growth.goin.earn.profileEmailAdded.helper"),
    },
    {
      key: "referralJoined",
      icon: "group_add",
      amount: issuance.referralJoined,
      label: t("growth.goin.earn.referralJoined.title"),
      helper: t("growth.goin.earn.referralJoined.helper"),
    },
    {
      key: "referralReward",
      icon: "share",
      amount: issuance.referralReward,
      label: t("growth.goin.earn.referralReward.title"),
      helper: t("growth.goin.earn.referralReward.helper"),
    },
    {
      key: "draftCreated",
      icon: "draft",
      amount: issuance.draftCreated,
      label: t("growth.goin.earn.draftCreated.title"),
      helper: t("growth.goin.earn.draftCreated.helper"),
    },
  ].filter(item => item.amount > 0);
});

const promptUnlockCost = computed(() => {
  return policy.value?.sinks.promptArchiveUnlock.costGoin ?? 0;
});

onMounted(() => {
  void economy.refresh();
});
</script>

<template>
  <el-flex rules="ccs" :gap="18" class="w100">
    <el-flex
      rules="rbc"
      :gap="16"
      class="w100"
      bg="orange10"
      :p="14"
      :radius="14">
      <el-flex rules="ccs" :gap="3" class="fg100">
        <el-text :size="12" :weight="800">{{ t("growth.goin.balanceTitle") }}</el-text>
        <el-text :size="11" color="normal55">{{ t("growth.goin.balanceHelper") }}</el-text>
      </el-flex>
      <EconomyGoinAmount :value="economy.balance.value" :size="20" :weight="800" />
    </el-flex>

    <el-flex
      v-if="policy"
      rules="rsc"
      :gap="10"
      class="w100"
      bg="blue10"
      :p="12"
      :radius="12">
      <el-icon icon="science" color="blue" :size="18" />
      <el-text :size="11" color="normal55" class="fg100">
        {{ t("growth.goin.simulationReference", { value: formattedReferenceValue }) }}
      </el-text>
    </el-flex>

    <el-flex v-if="economy.loading.value && !policy" rules="ccc" :gap="8" class="w100" :p="24">
      <el-icon icon="refresh" color="prim" :size="24" />
      <el-text :size="12" color="normal55">{{ t("growth.goin.loading") }}</el-text>
    </el-flex>

    <el-flex v-else-if="economy.error.value && !policy" rules="rsc" :gap="8" class="w100" bg="red10" :p="12" :radius="12">
      <el-icon icon="warning" color="red" :size="18" />
      <el-text :size="11" color="red">{{ t("growth.goin.loadError") }}</el-text>
    </el-flex>

    <template v-else-if="policy">
      <el-flex rules="ccs" :gap="10" class="w100">
        <el-flex rules="ccs" :gap="3" class="w100">
          <el-text :size="17" :weight="850">{{ t("growth.goin.earn.title") }}</el-text>
          <el-text :size="11" color="normal55">{{ t("growth.goin.earn.description") }}</el-text>
        </el-flex>

        <el-flex rules="ccs" :gap="8" class="w100">
          <el-flex
            v-for="item in earnItems"
            :key="item.key"
            rules="rbc"
            :gap="12"
            class="w100"
            bg="normal5"
            :p="[10, 12]"
            :radius="11">
            <el-flex rules="rsc" :gap="9" class="fg100">
              <el-icon :icon="item.icon" color="green" :size="18" />
              <el-flex rules="ccs" :gap="2" class="fg100">
                <el-text :size="12" :weight="750">{{ item.label }}</el-text>
                <el-text :size="10" color="normal55">{{ item.helper }}</el-text>
              </el-flex>
            </el-flex>
            <EconomyGoinAmount :value="`+${item.amount}`" :size="13" :weight="800" color="green" />
          </el-flex>
        </el-flex>
      </el-flex>

      <el-flex rules="ccs" :gap="10" class="w100">
        <el-flex rules="ccs" :gap="3" class="w100">
          <el-text :size="17" :weight="850">{{ t("growth.goin.spend.title") }}</el-text>
          <el-text :size="11" color="normal55">{{ t("growth.goin.spend.description") }}</el-text>
        </el-flex>

        <el-flex rules="rbc" :gap="12" class="w100" bg="normal5" :p="[10, 12]" :radius="11">
          <el-flex rules="rsc" :gap="9" class="fg100">
            <el-icon icon="lock_open" color="orange" :size="18" />
            <el-flex rules="ccs" :gap="2" class="fg100">
              <el-text :size="12" :weight="750">{{ t("growth.goin.spend.promptUnlock.title") }}</el-text>
              <el-text :size="10" color="normal55">{{ t("growth.goin.spend.promptUnlock.helper") }}</el-text>
            </el-flex>
          </el-flex>
          <EconomyGoinAmount :value="`-${promptUnlockCost}`" :size="13" :weight="800" color="orange" />
        </el-flex>
      </el-flex>
    </template>
  </el-flex>
</template>

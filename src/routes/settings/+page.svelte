<script lang="ts">
  import { onMount } from 'svelte';
  import Swal from 'sweetalert2';
  import axiosClient from '$lib/axiosClient';
  import { setUser, patchUser } from '$lib/stores/user';

  // ---------------------------
  // Global UI
  // ---------------------------
  let disabled = false;
  let activeTab: 'profile' | 'keamanan' | 'role' = 'profile';
  let pageLoading = true;
  let errorMsg = '';

  function showSuccess(message: string) {
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: message,
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }
  function showError(message: string) {
    Swal.fire({
      icon: 'error',
      title: 'Gagal',
      text: message,
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }

  // ---------------------------
  // Profile
  // ---------------------------
  let profile = { name: '', email: '' };
  let initialProfile = { ...profile };
  let savingProfile = false;

  $: profileDirty = JSON.stringify(profile) !== JSON.stringify(initialProfile);

  async function submitProfile() {
    if (!profileDirty || savingProfile) return;
    savingProfile = true;
    errorMsg = '';
    try {
      const { data } = await axiosClient.put('/auth/profile', { name: profile.name });
      profile.name = data?.name ?? profile.name;
      initialProfile = { ...profile };
      patchUser({ name: profile.name });
      showSuccess('Profil berhasil diperbarui');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string' ? err.response.data : 'Gagal memperbarui nama.');
      showError(msg);
    } finally {
      savingProfile = false;
    }
  }

  function resetProfileToInitial() {
    profile = { ...initialProfile };
  }

  // ---------------------------
  // Keamanan / Password
  // ---------------------------
  let pw = { current: '', next: '', confirm: '' };
  let showPw = { current: false, next: false, confirm: false };
  let savingPw = false;

  $: pwRules = {
    len8: pw.next.length >= 8,
    hasLower: /[a-z]/.test(pw.next),
    hasUpper: /[A-Z]/.test(pw.next),
    notSameAsOld: pw.next !== '' && pw.current !== '' && pw.next !== pw.current,
    confirmMatch: pw.next !== '' && pw.next === pw.confirm
  };
  $: canUpdatePw =
    pwRules.len8 &&
    pwRules.hasLower &&
    pwRules.hasUpper &&
    pwRules.notSameAsOld &&
    pwRules.confirmMatch &&
    !savingPw;

  async function handleChangePassword() {
    if (!canUpdatePw) return;
    savingPw = true;
    try {
      await axiosClient.put('/auth/password', {
        current_password: pw.current,
        password: pw.next,
        password_confirmation: pw.confirm
      });
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Password berhasil diperbarui',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      pw = { current: '', next: '', confirm: '' };
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string' ? err.response.data : 'Gagal memperbarui password.');
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: msg,
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } finally {
      savingPw = false;
    }
  }

  // ---------------------------
  // Role
  // ---------------------------
  const ROLE_ENDPOINT = '/auth/role';

  type RoleUser = {
    id: number;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
  };

  type PermissionActions = {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };

  const MODULE_KEYS = ['project', 'activity', 'mitra', 'bc', 'certificate'] as const;
  type ModuleKey = (typeof MODULE_KEYS)[number];

  const MODULE_LABELS: Record<ModuleKey, string> = {
    project: 'Project',
    activity: 'Activity',
    mitra: 'Mitra',
    bc: 'Barang Certificates',
    certificate: 'Certificates'
  };

  const ACTION_KEYS: (keyof PermissionActions)[] = ['view', 'create', 'update', 'delete'];
  const ACTION_LABELS: Record<keyof PermissionActions, string> = {
    view: 'View',
    create: 'Create',
    update: 'Update',
    delete: 'Delete'
  };

  type ModulesState = Record<ModuleKey, PermissionActions>;

  function createEmptyModules(): ModulesState {
    const base: PermissionActions = { view: false, create: false, update: false, delete: false };
    return {
      project: { ...base },
      activity: { ...base },
      mitra: { ...base },
      bc: { ...base },
      certificate: { ...base }
    };
  }

  function cloneModules(mods: ModulesState): ModulesState {
    return {
      project: { ...mods.project },
      activity: { ...mods.activity },
      mitra: { ...mods.mitra },
      bc: { ...mods.bc },
      certificate: { ...mods.certificate }
    };
  }

  type RoleForm = {
    userId: string;
    selectedRole: string;
    modules: ModulesState;
  };

  let users: RoleUser[] = [];
  let myRoles: string[] = [];
  let canManageRoles = false;
  let currentIsOnlyAdmin = false;
  let selectedUserIsSuperAdmin = false;

  let selectedUserId = '';

  let role: RoleForm = {
    userId: '',
    selectedRole: 'user',
    modules: createEmptyModules()
  };
  let initialRole: RoleForm = {
    userId: '',
    selectedRole: 'user',
    modules: createEmptyModules()
  };
  let savingRole = false;

  // modul mana yang lagi di-expand
  let expandedModules: Record<ModuleKey, boolean> = {
    project: true,
    activity: true,
    mitra: true,
    bc: true,
    certificate: true
  };

  $: roleDirty = JSON.stringify(role) !== JSON.stringify(initialRole);

  function applyUserRole(user: RoleUser | null) {
    if (!user) {
      selectedUserId = '';
      selectedUserIsSuperAdmin = false;
      role = {
        userId: '',
        selectedRole: 'user',
        modules: createEmptyModules()
      };
      initialRole = {
        userId: '',
        selectedRole: 'user',
        modules: createEmptyModules()
      };
      return;
    }

    const perms = (user.permissions ?? []) as string[];
    const modules = createEmptyModules();

    for (const moduleKey of MODULE_KEYS) {
      for (const action of ACTION_KEYS) {
        const permName = `${moduleKey}-${action}`;
        modules[moduleKey][action] = perms.includes(permName);
      }
    }

    selectedUserId = String(user.id);

    role = {
      userId: selectedUserId,
      selectedRole: user.roles && user.roles.length > 0 ? user.roles[0] : 'user',
      modules
    };

    selectedUserIsSuperAdmin = user.roles?.includes('super_admin') ?? false;
    initialRole = {
      userId: role.userId,
      selectedRole: role.selectedRole,
      modules: cloneModules(role.modules)
    };
  }

  function buildPermissionsPayload(r: RoleForm): Record<string, boolean> {
    const permissions: Record<string, boolean> = {};

    for (const moduleKey of MODULE_KEYS) {
      const mod = r.modules[moduleKey];
      for (const action of ACTION_KEYS) {
        permissions[`${moduleKey}-${action}`] = mod[action];
      }
    }

    return permissions;
  }

  function toggleModuleAll(moduleKey: ModuleKey, checked: boolean) {
    const updatedModule: PermissionActions = {
      ...role.modules[moduleKey],
      view: checked,
      create: checked,
      update: checked,
      delete: checked
    };

    role = {
      ...role,
      modules: {
        ...role.modules,
        [moduleKey]: updatedModule
      }
    };
  }

  function handleToggleAction(
    moduleKey: ModuleKey,
    action: keyof PermissionActions,
    checked: boolean
  ) {
    const updatedModule: PermissionActions = {
      ...role.modules[moduleKey],
      [action]: checked
    };

    role = {
      ...role,
      modules: {
        ...role.modules,
        [moduleKey]: updatedModule
      }
    };
  }

  function moduleAllChecked(moduleKey: ModuleKey): boolean {
    const mod = role.modules[moduleKey];
    return ACTION_KEYS.every((a) => mod[a]);
  }

  function moduleSomeChecked(moduleKey: ModuleKey): boolean {
    const mod = role.modules[moduleKey];
    const any = ACTION_KEYS.some((a) => mod[a]);
    const all = ACTION_KEYS.every((a) => mod[a]);
    return any && !all;
  }

  async function submitRole() {
    if (!roleDirty || savingRole) return;
    if (!role.userId) {
      showError('Silakan pilih user terlebih dahulu.');
      return;
    }

    savingRole = true;
    try {
      await axiosClient.put(ROLE_ENDPOINT, {
        user_id: Number(role.userId),
        permissions: buildPermissionsPayload(role),
        role: role.selectedRole
      });
      initialRole = {
        userId: role.userId,
        selectedRole: role.selectedRole,
        modules: cloneModules(role.modules)
      };
      showSuccess('Role & akses berhasil diperbarui');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string' ? err.response.data : 'Gagal menyimpan pengaturan role.');
      showError(msg);
    } finally {
      savingRole = false;
    }
  }

  function resetRoleToInitial() {
    role = {
      userId: initialRole.userId,
      selectedRole: initialRole.selectedRole,
      modules: cloneModules(initialRole.modules)
    };
    selectedUserId = role.userId;
  }

  // Kalau bukan admin/super_admin, jangan biarkan tab role aktif
  $: if (!canManageRoles && activeTab === 'role') {
    activeTab = 'profile';
  }

  // ---------------------------
  // Bootstrap
  // ---------------------------
  onMount(async () => {
    pageLoading = true;
    errorMsg = '';
    try {
      // 1) profile
      const { data } = await axiosClient.post('/auth/me');
      profile.name = data?.name ?? '';
      profile.email = data?.email ?? '';
      initialProfile = { ...profile };
      setUser({ name: profile.name, email: profile.email });

      // 2) role saya
      const r = await axiosClient.get('/auth/role/me');
      myRoles = r.data?.roles ?? [];

      const isAdmin = myRoles.includes('admin');
      const isSA = myRoles.includes('super_admin');

      currentIsOnlyAdmin = isAdmin && !isSA;
      canManageRoles = isAdmin || isSA;

      // 3) daftar user untuk role
      if (canManageRoles) {
        const resUsers = await axiosClient.get('/auth/role/users');
        users = resUsers.data?.data ?? [];

        if (users.length > 0) {
          applyUserRole(users[0]);
        } else {
          applyUserRole(null);
        }
      }
    } catch (err: any) {
      errorMsg = err?.response?.data?.message || 'Gagal memuat data pengguna.';
      showError(errorMsg);
    } finally {
      pageLoading = false;
    }
  });
</script>

<svelte:head>
  <title>Settings - Indogreen</title>
</svelte:head>

<div class="max-w-1xl">
  {#if pageLoading}
    <div class="mb-4 text-sm text-gray-900 dark:text-white">Memuat data…</div>
  {/if}
  {#if errorMsg}
    <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
      {errorMsg}
    </div>
  {/if}

  <!-- Tabs -->
  <div class="p-1 bg-gray-200 dark:bg-gray-700 rounded-lg inline-flex mb-4" role="tablist">
    <button
      on:click={() => (activeTab = 'profile')}
      class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 text-gray-700 dark:text-gray-200"
      class:bg-white={activeTab === 'profile'}
      class:dark:bg-neutral-900={activeTab === 'profile'}
      class:shadow={activeTab === 'profile'}
      role="tab"
      aria-selected={activeTab === 'profile'}
      aria-controls="panel-profile"
      id="tab-profile"
    >
      Profile
    </button>
    <button
      on:click={() => (activeTab = 'keamanan')}
      class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 text-gray-700 dark:text-gray-200"
      class:bg-white={activeTab === 'keamanan'}
      class:dark:bg-neutral-900={activeTab === 'keamanan'}
      class:shadow={activeTab === 'keamanan'}
      role="tab"
      aria-selected={activeTab === 'keamanan'}
      aria-controls="panel-keamanan"
      id="tab-keamanan"
    >
      Keamanan
    </button>

    {#if canManageRoles}
      <button
        on:click={() => (activeTab = 'role')}
        class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 text-gray-700 dark:text-gray-200"
        class:bg-white={activeTab === 'role'}
        class:dark:bg-neutral-900={activeTab === 'role'}
        class:shadow={activeTab === 'role'}
        role="tab"
        aria-selected={activeTab === 'role'}
        aria-controls="panel-role"
        id="tab-role"
      >
        Role
      </button>
    {/if}
  </div>

  <!-- PROFILE TAB -->
  {#if activeTab === 'profile'}
    <div id="panel-profile" role="tabpanel" aria-labelledby="tab-profile">
      <form on:submit|preventDefault={submitProfile}>
        <div class="bg-white dark:bg-black space-y-12 py-4 px-4 rounded-lg sm:px-6 lg:px-8">
          <div>
            <h2 class="text-base/7 font-semibold text-gray-900 dark:text-white">Personal Information</h2>
            <p class="mt-1 text-sm/6 text-gray-600 dark:text-gray-300">Kelola informasi data pribadi kamu.</p>

            <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div class="sm:col-span-4">
                <label for="name" class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">Name</label>
                <div class="mt-2">
                  <input
                    id="name"
                    type="text"
                    bind:value={profile.name}
                    autocomplete="given-name"
                    class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                           outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                           placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 disabled:opacity-60"
                    disabled={disabled || pageLoading || savingProfile}
                  />
                </div>
              </div>

              <div class="sm:col-span-4">
                <label for="email" class="block text-sm/6 font-medium text-gray-900 dark:text-gray-300"
                  >Email address</label
                >
                <div class="mt-2">
                  <input
                    id="email"
                    type="email"
                    bind:value={profile.email}
                    autocomplete="email"
                    readonly
                    class="block w-full rounded-md bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 text-base text-gray-700 dark:text-gray-300
                           outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 placeholder:text-gray-400 sm:text-sm/6 cursor-not-allowed"
                  />
                </div>
                <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Email hanya ditampilkan dan tidak bisa diubah.</p>
              </div>
            </div>

            <div class="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                on:click={resetProfileToInitial}
                class="text-sm/6 font-semibold text-gray-900 dark:text-gray-200"
                disabled={!profileDirty || savingProfile}
              >
                Reset
              </button>
              <button
                type="submit"
                class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60"
                disabled={!profileDirty || savingProfile || pageLoading}
              >
                {savingProfile ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  {/if}

  <!-- KEAMANAN TAB -->
  {#if activeTab === 'keamanan'}
    <div id="panel-keamanan" role="tabpanel" aria-labelledby="tab-keamanan">
      <div class="bg-white dark:bg-black py-4 px-4 rounded-lg sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <div>
              <h2 class="text-base/7 font-semibold text-gray-900 dark:text-white">Ubah Password</h2>
              <p class="mt-1 text-sm/6 text-gray-600 dark:text-gray-300">
                Ubah Password dengan memasukkan password lama dan password baru
              </p>

              <div class="mt-6 space-y-5">
                <!-- Lama -->
                <div>
                  <span class="block text-sm font-medium text-gray-900 dark:text-gray-100">Password Lama</span>
                  <div class="mt-2 relative">
                    <input
                      type={showPw.current ? 'text' : 'password'}
                      class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100
                             outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 placeholder:text-gray-400
                             focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                      placeholder="Masukkan password lama"
                      bind:value={pw.current}
                      autocomplete="current-password"
                    />
                    <button
                      type="button"
                      class="absolute inset-y-0 right-2 my-auto p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400"
                      on:click={() => (showPw = { ...showPw, current: !showPw.current })}
                      aria-label="Toggle password lama"
                    >
                      {#if showPw.current}
                        <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8">
                          <path d="M3 3l18 18" />
                          <path d="M10.58 10.58A3 3 0 0 0 9 12a3 3 0 0 0 3 3c.49 0 .95-.12 1.35-.33" />
                          <path
                            d="M6.61 6.61C4.27 7.98 2.73 10 2.73 10s3.64 6.27 9.27 6.27c1.06 0 2.07-.17 3.01-.49"
                          />
                          <path
                            d="M17.94 13.11C19.73 11.86 21.27 10 21.27 10S17.64 3.73 12 3.73a8.8 8.8 0 0 0-2.18.28"
                          />
                        </svg>
                      {:else}
                        <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      {/if}
                    </button>
                  </div>
                </div>

                <!-- Baru -->
                <div>
                  <span class="block text-sm font-medium text-gray-900 dark:text-gray-100">Password Baru</span>
                  <div class="mt-2 relative">
                    <input
                      type={showPw.next ? 'text' : 'password'}
                      class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100
                             outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 placeholder:text-gray-400
                             focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                      placeholder="Masukkan password baru"
                      bind:value={pw.next}
                      autocomplete="new-password"
                    />
                    <button
                      type="button"
                      class="absolute inset-y-0 right-2 my-auto p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400"
                      on:click={() => (showPw = { ...showPw, next: !showPw.next })}
                      aria-label="Toggle password baru"
                    >
                      {#if showPw.next}
                        <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8">
                          <path d="M3 3l18 18" />
                          <path d="M10.58 10.58A3 3 0 0 0 9 12a3 3 0 0 0 3 3c.49 0 .95-.12 1.35-.33" />
                          <path
                            d="M6.61 6.61C4.27 7.98 2.73 10 2.73 10s3.64 6.27 9.27 6.27c1.06 0 2.07-.17 3.01-.49"
                          />
                          <path
                            d="M17.94 13.11C19.73 11.86 21.27 10 21.27 10S17.64 3.73 12 3.73a8.8 8.8 0 0 0-2.18.28"
                          />
                        </svg>
                      {:else}
                        <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      {/if}
                    </button>
                  </div>
                </div>

                <!-- Konfirmasi -->
                <div>
                  <span class="block text-sm font-medium text-gray-900 dark:text-gray-100">Konfirmasi Password Baru</span>
                  <div class="mt-2 relative">
                    <input
                      type={showPw.confirm ? 'text' : 'password'}
                      class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100
                             outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 placeholder:text-gray-400
                             focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                      placeholder="Masukkan konfirmasi password baru"
                      bind:value={pw.confirm}
                      autocomplete="new-password"
                    />
                    <button
                      type="button"
                      class="absolute inset-y-0 right-2 my-auto p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400"
                      on:click={() => (showPw = { ...showPw, confirm: !showPw.confirm })}
                      aria-label="Toggle konfirmasi password"
                    >
                      {#if showPw.confirm}
                        <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8">
                          <path d="M3 3l18 18" />
                          <path d="M10.58 10.58A3 3 0 0 0 9 12a3 3 0 0 0 3 3c.49 0 .95-.12 1.35-.33" />
                          <path
                            d="M6.61 6.61C4.27 7.98 2.73 10 2.73 10s3.64 6.27 9.27 6.27c1.06 0 2.07-.17 3.01-.49"
                          />
                          <path
                            d="M17.94 13.11C19.73 11.86 21.27 10 21.27 10S17.64 3.73 12 3.73a8.8 8.8 0 0 0-2.18.28"
                          />
                        </svg>
                      {:else}
                        <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      {/if}
                    </button>
                  </div>
                  {#if pw.confirm && !pwRules.confirmMatch}
                    <p class="mt-2 text-xs text-red-600 dark:text-red-400">Konfirmasi tidak sama.</p>
                  {/if}
                </div>

                <div class="pt-2">
                  <button
                    type="button"
                    class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500
                          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60"
                    on:click={handleChangePassword}
                    disabled={!canUpdatePw}
                  >
                    {savingPw ? 'Memperbarui…' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside class="lg:col-span-1">
            <div class="rounded-xl bg-teal-600/90 text-white p-5 dark:bg-teal-700">
              <h3 class="font-semibold text-lg">Persyaratan Password</h3>
              <p class="mt-1 text-sm opacity-90">Untuk membuat password yang kuat, ikuti aturan berikut:</p>
              <ul class="mt-4 space-y-2 text-sm">
                <li><span class="mt-0.5">{#if pwRules.len8}✅{:else}•{/if}</span> Minimal 8 karakter</li>
                <li><span class="mt-0.5">{#if pwRules.hasLower}✅{:else}•{/if}</span> Minimal satu huruf kecil</li>
                <li><span class="mt-0.5">{#if pwRules.hasUpper}✅{:else}•{/if}</span> Minimal satu huruf besar</li>
                <li><span class="mt-0.5">{#if pwRules.notSameAsOld}✅{:else}•{/if}</span> Tidak sama dengan password lama</li>
                <li><span class="mt-0.5">{#if pwRules.confirmMatch}✅{:else}•{/if}</span> Konfirmasi harus sama</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  {/if}

  <!-- ROLE TAB (hanya kalau bisa manage) -->
  {#if activeTab === 'role' && canManageRoles}
    <div id="panel-role" role="tabpanel" aria-labelledby="tab-role">
      <form on:submit|preventDefault={submitRole}>
        <div class="bg-white dark:bg-black space-y-12 py-4 px-4 rounded-lg sm:px-6 lg:px-8">
          <div>
            <h2 class="text-base/7 font-semibold text-gray-900 dark:text-white">Role</h2>
            <p class="mt-1 text-sm/6 text-gray-600 dark:text-gray-300">
              Role kamu: {myRoles.length ? myRoles.join(', ') : '—'}
            </p>

            <!-- Pilih User -->
            <div class="mt-10 sm:col-span-2">
              <label for="userId" class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                Pilih User
              </label>
              <div class="mt-2">
                <select
                  id="userId"
                  bind:value={selectedUserId}
                  on:change={(e) => {
                    const selectedId = Number((e.currentTarget as HTMLSelectElement).value);
                    const selected = users.find((u) => u.id === selectedId) ?? null;
                    applyUserRole(selected);
                  }}
                  disabled={pageLoading || !users.length}
                  class="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900
                         px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  {#if !users.length}
                    <option value="">Tidak ada user lain</option>
                  {:else}
                    {#each users as u}
                      <option value={String(u.id)}>
                        {u.name} ({u.email})
                      </option>
                    {/each}
                  {/if}
                </select>
              </div>
            </div>

            <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <!-- Role -->
              <fieldset class="sm:col-span-3">
                <legend class="text-sm/6 font-semibold text-gray-900 dark:text-gray-100">Pilih Role</legend>
                <div class="mt-6 space-y-3">
                  <div class="flex items-center gap-x-3">
                    <input
                      id="push-admin"
                      type="radio"
                      bind:group={role.selectedRole}
                      value="admin"
                      disabled={currentIsOnlyAdmin && selectedUserIsSuperAdmin}
                      class="relative size-4 appearance-none rounded-full border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-neutral-900 before:absolute before:inset-1 before:rounded-full before:bg-white dark:before:bg-neutral-900
                             not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600
                             focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    />
                    <label for="push-admin" class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                      Admin
                    </label>
                  </div>
                  <div class="flex items-center gap-x-3">
                    <input
                      id="push-staff"
                      type="radio"
                      bind:group={role.selectedRole}
                      value="staff"
                      class="relative size-4 appearance-none rounded-full border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-neutral-900 before:absolute before:inset-1 before:rounded-full before:bg-white dark:before:bg-neutral-900
                             not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600
                             focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    />
                    <label for="push-staff" class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                      Staff
                    </label>
                  </div>
                  <div class="flex items-center gap-x-3">
                    <input
                      id="push-user"
                      type="radio"
                      bind:group={role.selectedRole}
                      value="user"
                      class="relative size-4 appearance-none rounded-full border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-neutral-900 before:absolute before:inset-1 before:rounded-full before:bg-white dark:before:bg-neutral-900
                             not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600
                             focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    />
                    <label for="push-user" class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                      User
                    </label>
                  </div>
                </div>
              </fieldset>

              <!-- Job / Modul & Permission -->
              <fieldset class="sm:col-span-3">
                <legend class="text-sm/6 font-semibold text-gray-900 dark:text-gray-100">
                  Pilih Permission per Modul
                </legend>

                <div class="mt-4 space-y-3">
                  {#each MODULE_KEYS as moduleKey}
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                      <!-- Header modul -->
                      <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                          <!-- Master checkbox modul -->
                          <div class="flex h-6 shrink-0 items-center">
                            <div class="group grid size-4 grid-cols-1">
                              <input
                                type="checkbox"
                                class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 dark:border-gray-600
                                       bg-white dark:bg-neutral-900 checked:border-indigo-600 checked:bg-indigo-600
                                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                checked={moduleAllChecked(moduleKey)}
                                indeterminate={moduleSomeChecked(moduleKey)}
                                on:change={(e) =>
                                  toggleModuleAll(
                                    moduleKey,
                                    (e.currentTarget as HTMLInputElement).checked
                                  )}
                              />
                              <svg
                                viewBox="0 0 14 14"
                                fill="none"
                                class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                              >
                                <path
                                  d="M3 8L6 11L11 3.5"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  class="opacity-0 group-has-checked:opacity-100"
                                />
                                <path
                                  d="M3 7H11"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  class="opacity-0 group-has-indeterminate:opacity-100"
                                />
                              </svg>
                            </div>
                          </div>

                          <button
                            type="button"
                            class="text-sm/6 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1"
                            on:click={() =>
                              (expandedModules = {
                                ...expandedModules,
                                [moduleKey]: !expandedModules[moduleKey]
                              })}
                          >
                            {MODULE_LABELS[moduleKey]}
                            <svg
                              class="size-3.5 transition-transform"
                              viewBox="0 0 20 20"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="1.8"
                              class:rotate-90={expandedModules[moduleKey]}
                            >
                              <path d="M7 5l6 5-6 5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <!-- Sub permission -->
                      {#if expandedModules[moduleKey]}
                        <div class="mt-3 pl-6 space-y-2">
                          {#each ACTION_KEYS as actionKey}
                            <div class="flex items-center gap-3">
                              <input
                                type="checkbox"
                                class="h-4 w-4 rounded border-gray-300 dark:border-gray-600
                                       text-indigo-600 focus:ring-indigo-600"
                                checked={role.modules[moduleKey][actionKey]}
                                on:change={(e) =>
                                  handleToggleAction(
                                    moduleKey,
                                    actionKey,
                                    (e.currentTarget as HTMLInputElement).checked
                                  )}
                              />
                              <span class="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {ACTION_LABELS[actionKey]}
                              </span>
                            </div>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </fieldset>
            </div>

            <div class="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                on:click={resetRoleToInitial}
                class="text-sm/6 font-semibold text-gray-900 dark:text-gray-200"
                disabled={!roleDirty || savingRole}
              >
                Reset
              </button>
              <button
                type="submit"
                class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500
                      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60"
                disabled={
                  !roleDirty ||
                  savingRole ||
                  pageLoading ||
                  !role.userId ||
                  (currentIsOnlyAdmin && selectedUserIsSuperAdmin)
                }
              >
                {savingRole ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  {/if}
</div>

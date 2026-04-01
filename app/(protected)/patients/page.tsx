import {
  addUserToGroup,
  createGroup,
  createPatient,
  updateGroup,
  updateGroupMember,
  updatePatient,
} from "@/app/actions";
import { getAppData } from "@/lib/app-data";
import {
  APP_ROLES,
  APP_ROLE_LABELS,
  hasPermission,
  normalizeAppRole,
} from "@/lib/roles";

function renderMultilineValue(value: string | null | undefined) {
  return value || "Sin registrar";
}

export default async function PatientsPage() {
  const data = await getAppData();
  const viewer = data.viewer;

  if (!viewer || !hasPermission(viewer.role, "view_patients")) {
    return null;
  }

  const canManageFamilyWorkspace = hasPermission(
    viewer.role,
    "manage_family_workspace"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pacientes y grupos</h1>
        <p className="mt-2 text-white/65">
          {canManageFamilyWorkspace
            ? "Gestiona perfiles, grupos familiares y la red de apoyo de cada paciente."
            : "Consulta la información relevante de los pacientes y su red de cuidado."}
        </p>
      </div>

      {canManageFamilyWorkspace ? (
        <>
          <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="xl:max-w-sm">
                <h2 className="text-lg font-semibold">Crear grupo</h2>
                <p className="mt-1 text-sm text-white/60">
                  Usa grupos para organizar pacientes y colaboradores por familia o núcleo de cuidado.
                </p>
              </div>

              <form action={createGroup} className="grid w-full max-w-2xl gap-3 md:grid-cols-[1fr_auto]">
                <div>
                  <label className="mb-1 block text-sm text-white/75">Nombre del grupo</label>
                  <input
                    name="name"
                    type="text"
                    className="w-full rounded border border-white/20 bg-black px-3 py-2"
                    placeholder="Ej: Familia Rivas"
                    required
                  />
                </div>
                <div className="md:self-end">
                  <button
                    type="submit"
                    className="rounded bg-white px-4 py-2 text-black"
                  >
                    Crear grupo
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="xl:max-w-sm">
                <h2 className="text-lg font-semibold">Crear paciente</h2>
                <p className="mt-1 text-sm text-white/60">
                  Registra nuevos pacientes reales y déjalos listos para tareas, signos vitales, inventario y resumen diario.
                </p>
              </div>

              <form action={createPatient} className="grid w-full max-w-4xl gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-white/75">Nombre</label>
                  <input
                    name="name"
                    type="text"
                    className="w-full rounded border border-white/20 bg-black px-3 py-2"
                    placeholder="Nombre completo del paciente"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/75">Edad</label>
                  <input
                    name="age"
                    type="number"
                    min="0"
                    className="w-full rounded border border-white/20 bg-black px-3 py-2"
                    placeholder="Ej: 67"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/75">Grupo</label>
                  <select
                    name="groupId"
                    defaultValue=""
                    className="w-full rounded border border-white/20 bg-black px-3 py-2"
                    required
                  >
                    <option value="" disabled>
                      Selecciona un grupo
                    </option>
                    {data.groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/75">DNI</label>
                  <input
                    name="dni"
                    type="text"
                    className="w-full rounded border border-white/20 bg-black px-3 py-2"
                    placeholder="Opcional"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="rounded bg-white px-4 py-2 text-black"
                  >
                    Crear paciente
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="xl:max-w-sm">
                <h2 className="text-lg font-semibold">Asignar colaborador a grupo</h2>
                <p className="mt-1 text-sm text-white/60">
                  Vincula cada colaborador al grupo donde trabaja actualmente y ajusta su rol operativo.
                </p>
              </div>

              <form action={addUserToGroup} className="grid w-full max-w-4xl gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm text-white/75">Colaborador</label>
                  <select
                    name="userId"
                    className="w-full rounded border border-white/20 bg-black px-3 py-2"
                    defaultValue=""
                    required
                  >
                    <option value="" disabled>
                      Selecciona un colaborador
                    </option>
                    {data.users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/75">Grupo</label>
                  <select
                    name="groupId"
                    className="w-full rounded border border-white/20 bg-black px-3 py-2"
                    defaultValue=""
                    required
                  >
                    <option value="" disabled>
                      Selecciona un grupo
                    </option>
                    {data.groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/75">Rol dentro del grupo</label>
                  <select
                    name="role"
                    className="w-full rounded border border-white/20 bg-black px-3 py-2"
                    defaultValue="FAMILIAR_LECTURA"
                  >
                    {APP_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {APP_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <button
                    type="submit"
                    className="rounded bg-white px-4 py-2 text-black"
                  >
                    Guardar asignación
                  </button>
                </div>
              </form>
            </div>
          </section>
        </>
      ) : null}

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Grupos existentes</h2>
          <p className="text-sm text-white/60">
            Revisa qué pacientes y colaboradores pertenecen a cada grupo.
          </p>
        </div>

        <div className="space-y-4">
          {data.groups.map((group) => {
            const groupPatients = data.patients.filter((patient) => patient.groupId === group.id);
            const groupMembers = data.members.filter((member) => member.groupId === group.id);

            return (
              <article
                key={group.id}
                className="rounded-2xl border border-white/20 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{group.name}</h3>
                    <p className="mt-1 text-sm text-white/60">
                      {groupPatients.length} paciente(s) · {groupMembers.length} colaborador(es)
                    </p>
                  </div>

                  {canManageFamilyWorkspace ? (
                    <form action={updateGroup} className="flex w-full max-w-xl flex-col gap-3 md:flex-row md:items-end">
                      <input type="hidden" name="groupId" value={group.id} />
                      <div className="flex-1">
                        <label className="mb-1 block text-sm text-white/75">Renombrar grupo</label>
                        <input
                          name="name"
                          type="text"
                          defaultValue={group.name}
                          className="w-full rounded border border-white/20 bg-black px-3 py-2"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded bg-white px-4 py-2 text-black"
                      >
                        Guardar nombre
                      </button>
                    </form>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <section className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h4 className="text-sm font-semibold text-white/80">Pacientes del grupo</h4>
                    <div className="mt-3 space-y-3">
                      {groupPatients.length > 0 ? (
                        groupPatients.map((patient) => (
                          <div key={patient.id} className="rounded border border-white/10 p-3">
                            <p className="font-medium text-white">{patient.name}</p>
                            <p className="text-sm text-white/60">
                              Edad: {patient.age} · DNI: {patient.dni || "Sin registrar"}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="rounded border border-dashed border-white/15 px-3 py-3 text-sm text-white/55">
                          Sin pacientes asignados.
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h4 className="text-sm font-semibold text-white/80">Colaboradores del grupo</h4>
                    <div className="mt-3 space-y-3">
                      {groupMembers.length > 0 ? (
                        groupMembers.map((member) => (
                          <div key={member.id} className="rounded border border-white/10 p-3">
                            <p className="font-medium text-white">{member.user.name}</p>
                            <p className="text-sm text-white/60">{member.user.email}</p>
                            <p className="mt-1 text-sm text-white/70">
                              {APP_ROLE_LABELS[normalizeAppRole(member.role)]}
                            </p>
                            {canManageFamilyWorkspace ? (
                              <form action={updateGroupMember} className="mt-3 grid gap-3 md:grid-cols-3">
                                <input type="hidden" name="memberId" value={member.id} />
                                <div>
                                  <label className="mb-1 block text-sm text-white/75">Grupo</label>
                                  <select
                                    name="groupId"
                                    defaultValue={member.groupId}
                                    className="w-full rounded border border-white/20 bg-black px-3 py-2"
                                  >
                                    {data.groups.map((optionGroup) => (
                                      <option key={optionGroup.id} value={optionGroup.id}>
                                        {optionGroup.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-sm text-white/75">Rol</label>
                                  <select
                                    name="role"
                                    defaultValue={normalizeAppRole(member.role)}
                                    className="w-full rounded border border-white/20 bg-black px-3 py-2"
                                  >
                                    {APP_ROLES.map((role) => (
                                      <option key={role} value={role}>
                                        {APP_ROLE_LABELS[role]}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="md:self-end">
                                  <button
                                    type="submit"
                                    className="rounded bg-white px-4 py-2 text-black"
                                  >
                                    Reasignar
                                  </button>
                                </div>
                              </form>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <p className="rounded border border-dashed border-white/15 px-3 py-3 text-sm text-white/55">
                          Sin colaboradores asignados.
                        </p>
                      )}
                    </div>
                  </section>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Perfiles de pacientes</h2>
          <p className="text-sm text-white/60">
            Aquí puedes revisar la ficha clínica y los datos clave de emergencia.
          </p>
        </div>

        <div className="space-y-4">
          {data.patients.map((patient) => (
            <article
              key={patient.id}
              className="rounded-2xl border border-white/20 bg-black/20 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">{patient.name}</h3>
                  <p className="text-sm text-white/65">
                    Grupo: {patient.group?.name || "Sin grupo"} · Edad: {patient.age}
                  </p>
                  <p className="text-sm text-white/65">
                    DNI: {patient.dni || "Sin registrar"}
                  </p>
                </div>

                {canManageFamilyWorkspace ? (
                  <details className="w-full max-w-3xl rounded-xl border border-white/10 bg-white/5 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-white/80">
                      Editar perfil y ficha clínica
                    </summary>
                    <form action={updatePatient} className="mt-4 space-y-4">
                      <input type="hidden" name="patientId" value={patient.id} />

                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-sm text-white/75">Nombre</label>
                          <input
                            name="name"
                            type="text"
                            defaultValue={patient.name}
                            className="w-full rounded border border-white/20 bg-black px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm text-white/75">Edad</label>
                          <input
                            name="age"
                            type="number"
                            min="0"
                            defaultValue={patient.age}
                            className="w-full rounded border border-white/20 bg-black px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm text-white/75">Grupo</label>
                          <select
                            name="groupId"
                            defaultValue={patient.groupId}
                            className="w-full rounded border border-white/20 bg-black px-3 py-2"
                            required
                          >
                            {data.groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm text-white/75">DNI</label>
                        <input
                          name="dni"
                          type="text"
                          defaultValue={patient.dni || ""}
                          className="w-full rounded border border-white/20 bg-black px-3 py-2"
                          placeholder="Opcional"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm text-white/75">
                          Cuadro clínico (breve)
                        </label>
                        <textarea
                          name="clinicalSummary"
                          defaultValue={patient.clinicalSummary || ""}
                          rows={4}
                          className="w-full rounded border border-white/20 bg-black px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm text-white/75">
                          Medicaciones críticas
                        </label>
                        <textarea
                          name="criticalMedications"
                          defaultValue={patient.criticalMedications || ""}
                          rows={4}
                          className="w-full rounded border border-white/20 bg-black px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm text-white/75">
                          Alertas – venir a urgencias
                        </label>
                        <textarea
                          name="emergencyAlerts"
                          defaultValue={patient.emergencyAlerts || ""}
                          rows={5}
                          className="w-full rounded border border-white/20 bg-black px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm text-white/75">
                          Qué decir en triage
                        </label>
                        <textarea
                          name="triageMessage"
                          defaultValue={patient.triageMessage || ""}
                          rows={3}
                          className="w-full rounded border border-white/20 bg-black px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm text-white/75">Contactos</label>
                        <textarea
                          name="emergencyContacts"
                          defaultValue={patient.emergencyContacts || ""}
                          rows={4}
                          className="w-full rounded border border-white/20 bg-black px-3 py-2"
                        />
                      </div>

                      <button
                        type="submit"
                        className="rounded bg-white px-4 py-2 text-black"
                      >
                        Guardar cambios del paciente
                      </button>
                    </form>
                  </details>
                ) : null}
              </div>

              <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <h4 className="text-lg font-semibold">Ficha clínica / Emergencias</h4>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-sm font-medium text-white/75">Cuadro clínico (breve)</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                      {renderMultilineValue(patient.clinicalSummary)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-sm font-medium text-white/75">Medicaciones críticas</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                      {renderMultilineValue(patient.criticalMedications)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-3">
                    <p className="text-sm font-medium text-red-200">
                      Alertas – venir a urgencias
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-red-200">
                      {renderMultilineValue(patient.emergencyAlerts)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
                    <p className="text-sm font-medium text-amber-200">Qué decir en triage</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-amber-200">
                      {renderMultilineValue(patient.triageMessage)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 lg:col-span-2">
                    <p className="text-sm font-medium text-white/75">Contactos</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                      {renderMultilineValue(patient.emergencyContacts)}
                    </p>
                  </div>
                </div>
              </section>
            </article>
          ))}
        </div>
      </section>

      {!canManageFamilyWorkspace ? (
        <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
          <h2 className="mb-4 text-lg font-semibold">Equipo visible</h2>
          <div className="space-y-2">
            {data.members.map((member) => (
              <div key={member.id} className="rounded border border-white/20 p-3">
                <p><strong>Usuario:</strong> {member.user.name}</p>
                <p><strong>Grupo:</strong> {member.group.name}</p>
                <p><strong>Rol:</strong> {APP_ROLE_LABELS[normalizeAppRole(member.role)]}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

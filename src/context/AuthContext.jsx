import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [groups, setGroups] = useState([])
  const [activeGroup, setActiveGroup] = useState(null)
  const [groupMembers, setGroupMembers] = useState([])
  const [loading, setLoading] = useState(true)

  // 1. Initialize Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchUserProfile(session.user.id)
        } else {
          setProfile(null)
          setGroups([])
          setActiveGroup(null)
          setGroupMembers([])
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // 2. Fetch User Profile & User Groups
  const fetchUserProfile = async (userId) => {
    try {
      // Get profile
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profErr && profErr.code !== 'PGRST116') {
        console.error('Error fetching profile:', profErr)
      }

      setProfile(profData || { id: userId, full_name: user?.email?.split('@')[0] })

      // Fetch user groups
      await fetchUserGroups(userId)
    } catch (err) {
      console.error('Error initializing user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserGroups = async (userId) => {
    try {
      const { data: memberships, error } = await supabase
        .from('group_members')
        .select('group_id, role, groups(*)')
        .eq('user_id', userId)

      if (error) throw error

      const userGroups = memberships?.map(m => m.groups).filter(Boolean) || []
      setGroups(userGroups)

      // Set default active group if none selected or invalid
      if (userGroups.length > 0) {
        const storedGroup = userGroups.find(g => g.id === activeGroup?.id) || userGroups[0]
        setActiveGroup(storedGroup)
        await fetchGroupMembers(storedGroup.id)
      } else {
        setActiveGroup(null)
        setGroupMembers([])
      }
    } catch (err) {
      console.error('Error fetching groups:', err)
    }
  }

  const fetchGroupMembers = async (groupId) => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('*, profiles(*)')
        .eq('group_id', groupId)

      if (error) throw error
      setGroupMembers(data?.map(m => ({ ...m.profiles, role: m.role })) || [])
    } catch (err) {
      console.error('Error fetching group members:', err)
    }
  }

  const switchActiveGroup = async (group) => {
    setActiveGroup(group)
    if (group?.id) {
      await fetchGroupMembers(group.id)
    }
  }

  // 3. Auth Actions
  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const signUpWithEmail = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // 4. Group Actions
  const createGroup = async (groupName) => {
    if (!user) throw new Error('Usuario no autenticado')

    // Create group
    const { data: groupData, error: groupErr } = await supabase
      .from('groups')
      .insert([
        {
          name: groupName,
          created_by: user.id
        }
      ])
      .select()
      .single()

    if (groupErr) throw groupErr

    // Add user as admin member
    const { error: memberErr } = await supabase
      .from('group_members')
      .insert([
        {
          group_id: groupData.id,
          user_id: user.id,
          role: 'admin'
        }
      ])

    if (memberErr) throw memberErr

    await fetchUserGroups(user.id)
    setActiveGroup(groupData)
    return groupData
  }

  const joinGroupWithCode = async (inviteCode) => {
    if (!user) throw new Error('Usuario no autenticado')
    const cleanCode = inviteCode.trim().toUpperCase()

    // Find group by invite code using maybeSingle to avoid 406 errors
    const { data: groupData, error: findErr } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', cleanCode)
      .maybeSingle()

    if (findErr) {
      console.error('Error looking up group:', findErr)
      throw new Error('Error al buscar el grupo')
    }

    if (!groupData) {
      throw new Error('Código de invitación no encontrado o inválido')
    }

    // Insert membership
    const { error: joinErr } = await supabase
      .from('group_members')
      .insert([
        {
          group_id: groupData.id,
          user_id: user.id,
          role: 'member'
        }
      ])

    if (joinErr) {
      if (joinErr.code === '23505') {
        throw new Error('Ya eres miembro de este grupo')
      }
      throw joinErr
    }

    await fetchUserGroups(user.id)
    setActiveGroup(groupData)
    return groupData
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        groups,
        activeGroup,
        groupMembers,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        createGroup,
        joinGroupWithCode,
        switchActiveGroup,
        refreshGroups: () => user && fetchUserGroups(user.id),
        refreshMembers: () => activeGroup && fetchGroupMembers(activeGroup.id)
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

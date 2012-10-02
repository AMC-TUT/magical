# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'WordType'
        db.create_table('crystal_wordtype', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=45)),
        ))
        db.send_create_signal('crystal', ['WordType'])

        # Adding model 'List'
        db.create_table('crystal_list', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=45)),
            ('slug', self.gf('django.db.models.fields.SlugField')(unique=True, max_length=45)),
            ('organization', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['game.Organization'])),
        ))
        db.send_create_signal('crystal', ['List'])

        # Adding model 'Word'
        db.create_table('crystal_word', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('word', self.gf('django.db.models.fields.CharField')(max_length=45)),
            ('type', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['crystal.WordType'])),
            ('list', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['crystal.List'])),
        ))
        db.send_create_signal('crystal', ['Word'])


    def backwards(self, orm):
        # Deleting model 'WordType'
        db.delete_table('crystal_wordtype')

        # Deleting model 'List'
        db.delete_table('crystal_list')

        # Deleting model 'Word'
        db.delete_table('crystal_word')


    models = {
        'crystal.list': {
            'Meta': {'object_name': 'List'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '45'}),
            'organization': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['game.Organization']"}),
            'slug': ('django.db.models.fields.SlugField', [], {'unique': 'True', 'max_length': '45'})
        },
        'crystal.word': {
            'Meta': {'object_name': 'Word'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'list': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['crystal.List']"}),
            'type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['crystal.WordType']"}),
            'word': ('django.db.models.fields.CharField', [], {'max_length': '45'})
        },
        'crystal.wordtype': {
            'Meta': {'object_name': 'WordType'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '45'})
        },
        'game.country': {
            'Meta': {'object_name': 'Country'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '45'}),
            'slug': ('django.db.models.fields.SlugField', [], {'max_length': '45'})
        },
        'game.language': {
            'Meta': {'object_name': 'Language'},
            'code': ('django.db.models.fields.CharField', [], {'max_length': '2'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'slug': ('django.db.models.fields.SlugField', [], {'unique': 'True', 'max_length': '45'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '45'})
        },
        'game.organization': {
            'Meta': {'object_name': 'Organization'},
            'country': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['game.Country']"}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['game.Language']"}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'slug': ('django.db.models.fields.SlugField', [], {'unique': 'True', 'max_length': '100'}),
            'updated': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['crystal']